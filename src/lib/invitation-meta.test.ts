import { describe, expect, it } from "vitest";
import { buildInvitationMeta } from "./invitation-meta";

const base = {
  title: "Seminar Komunitas",
  coverPhotoId: "3f4b6c1e-7d5a-4d0e-9d57-2f1d1e6c9a11",
  events: [
    { date: null, venueName: "Aula Tanpa Tanggal" },
    { date: "2026-12-12", venueName: "Gedung Melati, Bandung" },
  ],
};

describe("buildInvitationMeta", () => {
  it("memuat judul event, tanggal acara pertama yang punya tanggal, tempat, dan foto cover", () => {
    const meta = buildInvitationMeta(base);
    expect(meta.title).toEqual({ absolute: "Undangan Seminar Komunitas" });
    expect(meta.description).toBe("Sabtu, 12 Desember 2026 · Gedung Melati, Bandung");
    expect(meta.openGraph).toMatchObject({
      title: "Undangan Seminar Komunitas",
      description: "Sabtu, 12 Desember 2026 · Gedung Melati, Bandung",
      type: "website",
      locale: "id_ID",
    });
    const images = (meta.openGraph as { images: { url: string; width: number; height: number }[] }).images;
    expect(images).toEqual([
      expect.objectContaining({ url: `/og/${base.coverPhotoId}`, width: 1200, height: 630 }),
    ]);
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: [`/og/${base.coverPhotoId}`] });
  });

  it("tidak pernah memuat nama tamu karena tidak menerimanya", () => {
    const serialized = JSON.stringify(buildInvitationMeta(base));
    expect(serialized).not.toMatch(/Kepada|Yth|Bapak|Ibu/);
  });

  it("memakai kartu ringkas tanpa gambar bila belum ada foto cover", () => {
    const meta = buildInvitationMeta({ ...base, coverPhotoId: null });
    expect((meta.openGraph as { images: unknown[] }).images).toEqual([]);
    expect(meta.twitter).toMatchObject({ card: "summary", images: [] });
  });

  it("memberi deskripsi cadangan bila tanggal dan tempat belum ada", () => {
    const meta = buildInvitationMeta({ ...base, events: [{ date: null, venueName: null }] });
    expect(meta.description).toBe("Anda diundang untuk menghadiri acara ini.");
  });

  it("menulis tanggal saja bila tempat kosong", () => {
    const meta = buildInvitationMeta({ ...base, events: [{ date: "2026-12-12", venueName: null }] });
    expect(meta.description).toBe("Sabtu, 12 Desember 2026");
  });
});
