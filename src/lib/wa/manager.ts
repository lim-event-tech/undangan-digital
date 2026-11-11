import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "baileys";
import type { WASocket } from "baileys";
import { db } from "@/db";
import { clearStoredSession, hasStoredSession, loadPostgresAuthState } from "./auth-state";
import { randomDelayMs } from "./config";
import { getWaConfig } from "./config-service";
import { phoneToJid } from "./jid";
import { recoverInterrupted } from "./queue";
import { listAutoConnectUsers, saveSessionState } from "./session-service";
import { processNext, type SendOutcome, type WaPoster, type WaSender } from "./worker";

export type WaStatus = "mati" | "menyambung" | "menunggu-qr" | "terhubung" | "keluar";

export type WaSnapshot = {
  status: WaStatus;
  qr: string | null;
  nomor: string | null;
  galat: string | null;
  sejak: number | null;
};

const POLL_IDLE_MS = 5000;
const CAPTION_MAX = 1000;
const RECONNECT_MIN_MS = 3000;
const RECONNECT_MAX_MS = 60000;

const logger = {
  level: "silent",
  child() {
    return logger;
  },
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function numberFromJid(jid: string | undefined): string | null {
  if (!jid) return null;
  const digits = jid.split("@")[0]?.split(":")[0] ?? "";
  return digits ? `+${digits}` : null;
}

export class WaConnection implements WaSender {
  private socket: WASocket | null = null;
  private snapshotState: WaSnapshot = { status: "mati", qr: null, nomor: null, galat: null, sejak: null };
  private wanted = false;
  private retry = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connecting = false;
  private generation = 0;

  constructor(readonly userId: string) {}

  snapshot(): WaSnapshot {
    return { ...this.snapshotState };
  }

  ready(): boolean {
    return this.snapshotState.status === "terhubung" && this.socket !== null;
  }

  private update(patch: Partial<WaSnapshot>): void {
    this.snapshotState = { ...this.snapshotState, ...patch };
  }

  async connect(): Promise<void> {
    if (this.connecting) return;
    const status = this.snapshotState.status;
    if (status === "menyambung" || status === "menunggu-qr" || status === "terhubung") return;
    this.wanted = true;
    this.retry = 0;
    await saveSessionState(db, this.userId, { sambungOtomatis: true });
    await this.open();
  }

  async restore(): Promise<void> {
    if (!(await hasStoredSession(db, this.userId))) return;
    this.wanted = true;
    await this.open();
  }

  private async open(): Promise<void> {
    if (this.connecting) return;
    this.connecting = true;
    const generation = ++this.generation;
    try {
      this.clearReconnect();
      this.update({ status: "menyambung", qr: null, galat: null });
      const { state, saveCreds } = await loadPostgresAuthState(db, this.userId);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
      const socket = makeWASocket({
        ...(version ? { version } : {}),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        browser: Browsers.ubuntu("Chrome"),
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
      });
      this.socket = socket;

      socket.ev.on("creds.update", () => {
        void saveCreds();
      });

      socket.ev.on("connection.update", (update) => {
        if (generation !== this.generation) return;
        const { connection, lastDisconnect, qr } = update;
        if (qr) this.update({ status: "menunggu-qr", qr, galat: null });
        if (connection === "open") {
          this.retry = 0;
          const nomor = numberFromJid(socket.user?.id);
          this.update({ status: "terhubung", qr: null, galat: null, nomor, sejak: Date.now() });
          void saveSessionState(db, this.userId, { nomor });
        }
        if (connection === "close") {
          const code = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
            ?.output?.statusCode;
          void this.handleClose(code, state.creds.registered === true || Boolean(state.creds.me));
        }
      });
    } catch (error) {
      this.socket = null;
      this.update({
        status: "mati",
        qr: null,
        galat: error instanceof Error ? error.message : "Gagal menyambung",
      });
      this.scheduleReconnect();
    } finally {
      this.connecting = false;
    }
  }

  private async handleClose(code: number | undefined, registered: boolean): Promise<void> {
    this.socket = null;
    if (code === DisconnectReason.loggedOut) {
      await clearStoredSession(db, this.userId);
      await saveSessionState(db, this.userId, { sambungOtomatis: false, nomor: null });
      this.wanted = false;
      this.update({
        status: "keluar",
        qr: null,
        nomor: null,
        sejak: null,
        galat: "Perangkat dikeluarkan dari WhatsApp. Hubungkan ulang dengan memindai QR.",
      });
      return;
    }
    if (code === DisconnectReason.connectionReplaced) {
      this.wanted = false;
      await saveSessionState(db, this.userId, { sambungOtomatis: false });
      this.update({
        status: "mati",
        qr: null,
        sejak: null,
        galat: "Sesi dipakai di tempat lain, jadi koneksi ini dihentikan.",
      });
      return;
    }
    if (!this.wanted) {
      this.update({ status: "mati", qr: null, sejak: null });
      return;
    }
    if (code === DisconnectReason.restartRequired) {
      await this.open();
      return;
    }
    if (!registered) {
      this.wanted = false;
      this.update({
        status: "mati",
        qr: null,
        sejak: null,
        galat: "QR kedaluwarsa sebelum dipindai. Tekan Hubungkan untuk membuat QR baru.",
      });
      return;
    }
    this.update({ status: "menyambung", qr: null, sejak: null });
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.wanted) return;
    this.clearReconnect();
    const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_MIN_MS * 2 ** this.retry);
    this.retry += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.open();
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  async disconnect(): Promise<void> {
    this.wanted = false;
    this.clearReconnect();
    await saveSessionState(db, this.userId, { sambungOtomatis: false });
    this.generation += 1;
    const socket = this.socket;
    this.socket = null;
    try {
      socket?.end(undefined);
    } catch {
      this.socket = null;
    }
    this.update({ status: "mati", qr: null, sejak: null, galat: null });
  }

  async logout(): Promise<void> {
    this.wanted = false;
    this.clearReconnect();
    this.generation += 1;
    const socket = this.socket;
    this.socket = null;
    try {
      await socket?.logout();
    } catch {
      try {
        socket?.end(undefined);
      } catch {
        this.socket = null;
      }
    }
    await clearStoredSession(db, this.userId);
    await saveSessionState(db, this.userId, { sambungOtomatis: false, nomor: null });
    this.update({ status: "keluar", qr: null, nomor: null, sejak: null, galat: null });
  }

  async send(phone: string, text: string, poster?: WaPoster): Promise<SendOutcome> {
    const socket = this.socket;
    if (!socket || !this.ready()) return { ok: false, error: "WhatsApp belum terhubung" };
    const lookup = await socket.onWhatsApp(phoneToJid(phone));
    const target = lookup?.[0];
    if (!target?.exists) return { ok: false, error: "Nomor tidak terdaftar di WhatsApp" };
    try {
      await socket.presenceSubscribe(target.jid);
      await socket.sendPresenceUpdate("composing", target.jid);
      await sleep(1500 + Math.random() * 2500);
      await socket.sendPresenceUpdate("paused", target.jid);
      if (poster && text.length <= CAPTION_MAX) {
        await socket.sendMessage(target.jid, { image: poster.data, mimetype: poster.contentType, caption: text });
      } else if (poster) {
        await socket.sendMessage(target.jid, { image: poster.data, mimetype: poster.contentType });
        await sleep(1500 + Math.random() * 1500);
        await socket.sendMessage(target.jid, { text });
      } else {
        await socket.sendMessage(target.jid, { text });
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Gagal dikirim" };
    }
  }
}

class WaHub {
  private connections = new Map<string, WaConnection>();
  private workerRunning = false;

  for(userId: string): WaConnection {
    let connection = this.connections.get(userId);
    if (!connection) {
      connection = new WaConnection(userId);
      this.connections.set(userId, connection);
    }
    return connection;
  }

  has(userId: string): boolean {
    return this.connections.has(userId);
  }

  async boot(): Promise<void> {
    await recoverInterrupted(db);
    this.startWorker();
    for (const userId of await listAutoConnectUsers(db)) {
      await this.for(userId).restore().catch(() => undefined);
    }
  }

  private startWorker(): void {
    if (this.workerRunning) return;
    this.workerRunning = true;
    void this.runWorker();
  }

  private async runWorker(): Promise<void> {
    const nextAt = new Map<string, number>();
    for (;;) {
      let busy = false;
      try {
        const config = await getWaConfig(db);
        for (const connection of this.connections.values()) {
          if (!connection.ready()) continue;
          if ((nextAt.get(connection.userId) ?? 0) > Date.now()) continue;
          let result: Awaited<ReturnType<typeof processNext>> = "kosong";
          try {
            result = await processNext(db, connection, config, new Date(), connection.userId);
          } catch {
            result = "kosong";
          }
          const wait = result === "terkirim" || result === "gagal" ? randomDelayMs(config) : result === "dilewati" ? 500 : POLL_IDLE_MS;
          nextAt.set(connection.userId, Date.now() + wait);
          if (result === "terkirim" || result === "gagal" || result === "dilewati") busy = true;
        }
      } catch {
        busy = false;
      }
      await sleep(busy ? 200 : 1000);
    }
  }
}

const globalForWa = globalThis as unknown as { waHub?: WaHub };

export function getWaManager(): WaHub {
  return (globalForWa.waHub ??= new WaHub());
}
