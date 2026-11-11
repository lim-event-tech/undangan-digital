import net from "node:net";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { DEFAULT_SMTP, isSmtpReady, parseSmtpForm, readStoredSmtp, type SmtpConfig } from "./config";
import { decryptSecret, encryptSecret } from "./secret";
import { getSmtpConfig, getSmtpView, saveSmtpConfig } from "./service";
import { buildMessage, sendViaSmtp } from "./smtp";

let db: TestDb;
const servers: net.Server[] = [];

beforeAll(async () => {
  db = await createTestDb();
});

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

type Fake = { port: number; log: string[]; mail: { from?: string; to?: string; data?: string } };

async function fakeServer(options: { auth?: "PLAIN" | "LOGIN"; rejectRcpt?: boolean } = {}): Promise<Fake> {
  const log: string[] = [];
  const mail: Fake["mail"] = {};
  const server = net.createServer((socket) => {
    socket.on("error", () => undefined);
    socket.setEncoding("utf8");
    let buffer = "";
    let data: string | null = null;
    let loginStep = 0;
    socket.write("220 fake ESMTP\r\n");
    socket.on("data", (chunk: string) => {
      buffer += chunk;
      for (;;) {
        if (data !== null) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end < 0) return;
          mail.data = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          data = null;
          socket.write("250 queued\r\n");
          continue;
        }
        const index = buffer.indexOf("\r\n");
        if (index < 0) return;
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        log.push(line);
        if (loginStep === 1) {
          loginStep = 2;
          socket.write("334 UGFzc3dvcmQ6\r\n");
        } else if (loginStep === 2) {
          loginStep = 0;
          socket.write("235 ok\r\n");
        } else if (line.startsWith("EHLO")) {
          socket.write(`250-fake\r\n250-AUTH ${options.auth ?? "PLAIN"}\r\n250 8BITMIME\r\n`);
        } else if (line.startsWith("AUTH PLAIN")) {
          const [, user, pass] = Buffer.from(line.slice(11), "base64").toString("utf8").split("\0");
          socket.write(user === "akun" && pass === "rahasia" ? "235 ok\r\n" : "535 salah\r\n");
        } else if (line === "AUTH LOGIN") {
          loginStep = 1;
          socket.write("334 VXNlcm5hbWU6\r\n");
        } else if (line.startsWith("MAIL FROM:")) {
          mail.from = line.slice(10);
          socket.write("250 ok\r\n");
        } else if (line.startsWith("RCPT TO:")) {
          mail.to = line.slice(8);
          socket.write(options.rejectRcpt ? "550 tidak ada\r\n" : "250 ok\r\n");
        } else if (line === "DATA") {
          data = "";
          socket.write("354 go\r\n");
        } else if (line === "QUIT") {
          socket.end("221 bye\r\n");
        } else socket.write("500 ?\r\n");
      }
    });
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { port: (server.address() as net.AddressInfo).port, log, mail };
}

const config = (port: number, patch: Partial<SmtpConfig> = {}): SmtpConfig => ({
  ...DEFAULT_SMTP, aktif: true, host: "127.0.0.1", port, keamanan: "tanpa", user: "akun", password: "rahasia", dariNama: "Undangan Digital", dariEmail: "undangan@example.com", ...patch,
});

describe("sendViaSmtp", () => {
  it("mengirim surel dengan AUTH PLAIN, isi UTF-8, dan tanda titik di awal baris", async () => {
    const fake = await fakeServer();
    const result = await sendViaSmtp(config(fake.port), { to: "tujuan@example.com", subject: "Undangan Rapat Kerja — Penting", text: "Halo\n.baris titik\nTautan: https://x.test/terima/abc", html: "<p>Halo</p>" }, { domain: "app.test" });
    expect(result).toEqual({ ok: true });
    expect(fake.mail.from).toBe("<undangan@example.com>");
    expect(fake.mail.to).toBe("<tujuan@example.com>");
    const data = fake.mail.data ?? "";
    expect(data).toContain("Subject: =?UTF-8?B?");
    expect(data).toContain("multipart/alternative");
    const teks = data.split("\r\n\r\n").find((part) => part.includes("text/plain")) ?? data;
    expect(teks).toContain("Content-Transfer-Encoding: base64");
    const isi = Buffer.from((data.match(/text\/plain[^]*?base64\r\n\r\n([A-Za-z0-9+/=\r\n]+)\r\n--/) ?? [])[1]?.replace(/\r\n/g, "") ?? "", "base64").toString("utf8");
    expect(isi).toBe("Halo\n.baris titik\nTautan: https://x.test/terima/abc");
  });

  it("memakai AUTH LOGIN bila server hanya menawarkan LOGIN", async () => {
    const fake = await fakeServer({ auth: "LOGIN" });
    expect(await sendViaSmtp(config(fake.port), { to: "tujuan@example.com", subject: "Uji", text: "isi" })).toEqual({ ok: true });
    expect(fake.log).toContain("AUTH LOGIN");
    expect(Buffer.from(fake.log[fake.log.indexOf("AUTH LOGIN") + 1], "base64").toString()).toBe("akun");
  });

  it("melaporkan kata sandi salah, penerima ditolak, dan server yang tidak terjangkau", async () => {
    const salah = await fakeServer();
    const gagalAuth = await sendViaSmtp(config(salah.port, { password: "keliru" }), { to: "tujuan@example.com", subject: "Uji", text: "isi" });
    expect(gagalAuth).toMatchObject({ ok: false, error: expect.stringContaining("535") });
    const tolak = await fakeServer({ rejectRcpt: true });
    expect(await sendViaSmtp(config(tolak.port), { to: "tujuan@example.com", subject: "Uji", text: "isi" })).toMatchObject({ ok: false, error: expect.stringContaining("550") });
    const tutup = await fakeServer();
    servers.pop()?.close();
    expect((await sendViaSmtp(config(tutup.port), { to: "tujuan@example.com", subject: "Uji", text: "isi" })).ok).toBe(false);
  });

  it("menolak alamat tujuan tidak valid dan menahan injeksi header pada subjek dan nama pengirim", async () => {
    const fake = await fakeServer();
    expect(await sendViaSmtp(config(fake.port), { to: "bukan-surel", subject: "x", text: "y" })).toEqual({ ok: false, error: "Alamat tujuan tidak valid" });
    const mentah = buildMessage({ dariNama: "Nama\r\nBcc: x@y.z", dariEmail: "a@b.co" }, { to: "t@u.co", subject: "Judul\r\nBcc: korban@x.co", text: "isi" }, "app.test");
    expect(mentah.split("\r\n").filter((baris) => baris.startsWith("Bcc:"))).toEqual([]);
  });
});

describe("konfigurasi SMTP", () => {
  it("mengenkripsi kata sandi dan hanya bisa dibuka dengan kunci yang sama", () => {
    const stored = encryptSecret("rahasia-sekali");
    expect(stored).not.toContain("rahasia");
    expect(decryptSecret(stored)).toBe("rahasia-sekali");
    expect(decryptSecret(`${stored}x`)).toBeNull();
    expect(decryptSecret("rusak")).toBeNull();
    expect(encryptSecret("a")).not.toBe(encryptSecret("a"));
  });

  it("menyimpan, mempertahankan, mengganti, dan menghapus kata sandi tanpa pernah menampilkannya", async () => {
    const input = { aktif: true, host: "smtp.example.com", port: 587, keamanan: "starttls" as const, user: "akun", dariNama: "UD", dariEmail: "ud@example.com" };
    expect((await saveSmtpConfig(db, input, { baru: "satu", hapus: false })).adaPassword).toBe(true);
    expect(await getSmtpView(db)).not.toHaveProperty("password");
    expect((await getSmtpConfig(db)).password).toBe("satu");
    await saveSmtpConfig(db, { ...input, port: 465 }, { baru: null, hapus: false });
    expect(await getSmtpConfig(db)).toMatchObject({ password: "satu", port: 465 });
    await saveSmtpConfig(db, input, { baru: "dua", hapus: false });
    expect((await getSmtpConfig(db)).password).toBe("dua");
    expect((await saveSmtpConfig(db, input, { baru: null, hapus: true })).adaPassword).toBe(false);
    expect((await getSmtpConfig(db)).password).toBe("");
  });

  it("memvalidasi isian formulir", () => {
    const sah = parseSmtpForm(form({ aktif: "on", host: " SMTP.Example.com ", port: "587", keamanan: "starttls", user: "akun", password: "", dariNama: "UD", dariEmail: "UD@Example.com" }));
    expect(sah).toMatchObject({ ok: true, input: { host: "smtp.example.com", dariEmail: "ud@example.com" }, password: null, hapusPassword: false });
    for (const [patch, field] of [[{ port: "0" }, "port"], [{ port: "70000" }, "port"], [{ host: "bukan host" }, "host"], [{ keamanan: "aneh" }, "keamanan"], [{ dariEmail: "x" }, "dariEmail"], [{ host: "" }, "host"], [{ dariEmail: "" }, "dariEmail"], [{ user: "a\nb" }, "user"]] as const) {
      const dasar: Record<string, string> = { aktif: "on", host: "smtp.example.com", port: "587", keamanan: "starttls", user: "", password: "", dariNama: "UD", dariEmail: "ud@example.com" };
      const hasil = parseSmtpForm(form({ ...dasar, ...patch }));
      expect(hasil.ok, field).toBe(false);
      if (!hasil.ok) expect(hasil.errors, field).toHaveProperty(field);
    }
    expect(isSmtpReady(readStoredSmtp({ aktif: true, host: "h", dariEmail: "a@b.co" }) as unknown as SmtpConfig)).toBe(true);
    expect(isSmtpReady({ ...DEFAULT_SMTP, aktif: true, host: "h" })).toBe(false);
  });
});
