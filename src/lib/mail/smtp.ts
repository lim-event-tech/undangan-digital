import { randomBytes } from "node:crypto";
import net from "node:net";
import tls from "node:tls";
import { isEmailAddress, type SmtpConfig } from "./config";

export type MailMessage = { to: string; subject: string; text: string; html?: string };
export type MailResult = { ok: true } | { ok: false; error: string };

const TIMEOUT_MS = 20_000;

function header(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeWord(value: string): string {
  const clean = header(value);
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${Buffer.from(clean, "utf8").toString("base64")}?=`;
}

function base64Lines(value: string): string {
  return (Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g) ?? []).join("\r\n");
}

export function buildMessage(config: Pick<SmtpConfig, "dariNama" | "dariEmail">, message: MailMessage, domain: string, now: Date = new Date()): string {
  const boundary = `=_${randomBytes(12).toString("hex")}`;
  const from = `${encodeWord(config.dariNama)} <${header(config.dariEmail)}>`;
  const lines = [
    `From: ${from}`,
    `To: <${header(message.to)}>`,
    `Subject: ${encodeWord(message.subject)}`,
    `Date: ${now.toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${randomBytes(12).toString("hex")}@${domain}>`,
    "MIME-Version: 1.0",
  ];
  if (!message.html) {
    lines.push("Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", base64Lines(message.text));
  } else {
    lines.push(
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Lines(message.text),
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Lines(message.html),
      `--${boundary}--`,
    );
  }
  return lines.join("\r\n");
}

type Reply = { code: number; lines: string[] };

class Connection {
  private buffer = "";
  private waiting: ((reply: Reply | Error) => void) | null = null;
  private pending: Reply[] = [];
  private partial: string[] = [];
  private failure: Error | null = null;

  constructor(public socket: net.Socket | tls.TLSSocket) {
    this.attach(socket);
  }

  private attach(socket: net.Socket) {
    socket.setEncoding("utf8");
    socket.setTimeout(TIMEOUT_MS, () => this.fail(new Error("Server SMTP tidak merespons (waktu habis)")));
    socket.on("data", (chunk: string) => this.onData(chunk));
    socket.on("error", (error) => this.fail(error));
    socket.on("close", () => this.fail(new Error("Koneksi SMTP terputus")));
  }

  private fail(error: Error) {
    if (this.failure) return;
    this.failure = error;
    this.waiting?.(error);
    this.waiting = null;
  }

  private onData(chunk: string) {
    this.buffer += chunk;
    let index: number;
    while ((index = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, index).replace(/\r$/, "");
      this.buffer = this.buffer.slice(index + 1);
      this.partial.push(line);
      if (/^\d{3} /.test(line) || /^\d{3}$/.test(line)) {
        const reply = { code: Number(line.slice(0, 3)), lines: this.partial };
        this.partial = [];
        if (this.waiting) {
          const done = this.waiting;
          this.waiting = null;
          done(reply);
        } else this.pending.push(reply);
      }
    }
  }

  read(): Promise<Reply> {
    if (this.failure) return Promise.reject(this.failure);
    const queued = this.pending.shift();
    if (queued) return Promise.resolve(queued);
    return new Promise((resolve, reject) => {
      this.waiting = (value) => (value instanceof Error ? reject(value) : resolve(value));
    });
  }

  write(line: string) {
    this.socket.write(`${line}\r\n`);
  }

  async command(line: string, expected: number[]): Promise<Reply> {
    this.write(line);
    return this.expect(expected);
  }

  async expect(expected: number[]): Promise<Reply> {
    const reply = await this.read();
    if (!expected.includes(reply.code)) throw new Error(`SMTP menolak (${reply.code}): ${reply.lines.join(" ").slice(0, 200)}`);
    return reply;
  }

  async upgrade(host: string) {
    const raw = this.socket;
    raw.removeAllListeners("data");
    raw.removeAllListeners("close");
    raw.removeAllListeners("error");
    raw.setTimeout(0);
    this.buffer = "";
    this.partial = [];
    this.pending = [];
    const secure = tls.connect({ socket: raw, servername: net.isIP(host) ? undefined : host });
    await new Promise<void>((resolve, reject) => {
      secure.once("secureConnect", () => resolve());
      secure.once("error", reject);
    });
    secure.removeAllListeners("error");
    this.socket = secure;
    this.attach(secure);
  }

  close() {
    this.socket.destroy();
  }
}

function open(config: SmtpConfig): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket =
      config.keamanan === "ssl"
        ? tls.connect({ host: config.host, port: config.port, servername: net.isIP(config.host) ? undefined : config.host })
        : net.connect({ host: config.host, port: config.port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("Tidak bisa tersambung ke server SMTP (waktu habis)"));
    }, TIMEOUT_MS);
    socket.once(config.keamanan === "ssl" ? "secureConnect" : "connect", () => {
      clearTimeout(timer);
      socket.removeAllListeners("error");
      resolve(socket);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function dotStuff(data: string): string {
  return data.replace(/\r\n\./g, "\r\n..").replace(/^\./, "..");
}

export async function sendViaSmtp(config: SmtpConfig, message: MailMessage, options: { domain?: string; now?: Date } = {}): Promise<MailResult> {
  if (!config.host) return { ok: false, error: "Server SMTP belum diisi" };
  if (!isEmailAddress(message.to)) return { ok: false, error: "Alamat tujuan tidak valid" };
  const domain = options.domain ?? "localhost";
  let connection: Connection | null = null;
  try {
    connection = new Connection(await open(config));
    await connection.expect([220]);
    let capabilities = (await connection.command(`EHLO ${domain}`, [250])).lines.join("\n").toUpperCase();
    if (config.keamanan === "starttls") {
      if (!capabilities.includes("STARTTLS")) throw new Error("Server tidak mendukung STARTTLS. Pilih jenis koneksi lain");
      await connection.command("STARTTLS", [220]);
      await connection.upgrade(config.host);
      capabilities = (await connection.command(`EHLO ${domain}`, [250])).lines.join("\n").toUpperCase();
    }
    if (config.user) {
      if (/AUTH[ =].*PLAIN/.test(capabilities) || !/AUTH[ =].*LOGIN/.test(capabilities)) {
        const token = Buffer.from(`\0${config.user}\0${config.password}`, "utf8").toString("base64");
        await connection.command(`AUTH PLAIN ${token}`, [235]);
      } else {
        await connection.command("AUTH LOGIN", [334]);
        await connection.command(Buffer.from(config.user, "utf8").toString("base64"), [334]);
        await connection.command(Buffer.from(config.password, "utf8").toString("base64"), [235]);
      }
    }
    await connection.command(`MAIL FROM:<${header(config.dariEmail)}>`, [250]);
    await connection.command(`RCPT TO:<${header(message.to)}>`, [250, 251]);
    await connection.command("DATA", [354]);
    const body = buildMessage(config, message, domain, options.now);
    connection.socket.write(`${dotStuff(body)}\r\n.\r\n`);
    await connection.expect([250]);
    try {
      connection.write("QUIT");
    } catch {
      return { ok: true };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 300) : "Gagal mengirim surel" };
  } finally {
    connection?.close();
  }
}
