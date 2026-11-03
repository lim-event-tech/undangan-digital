import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { OG_HEIGHT, OG_MAX_BYTES, OG_WIDTH, renderOgImage } from "./og-image";

async function noisyPhoto(width: number, height: number, format: "png" | "jpeg") {
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 37 + ((i / 3) | 0) * 11) % 256;
  const image = sharp(raw, { raw: { width, height, channels: 3 } });
  return format === "png" ? image.png().toBuffer() : image.jpeg({ quality: 95 }).toBuffer();
}

describe("renderOgImage", () => {
  it("mengubah foto potret menjadi JPEG 1200x630 yang cukup kecil untuk pratinjau WhatsApp", async () => {
    const photo = await noisyPhoto(1500, 2200, "jpeg");
    const output = await renderOgImage(photo);

    const meta = await sharp(output).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(OG_WIDTH);
    expect(meta.height).toBe(OG_HEIGHT);
    expect(output.length).toBeLessThanOrEqual(OG_MAX_BYTES);
    expect(output[0]).toBe(0xff);
    expect(output[1]).toBe(0xd8);
  });

  it("menerima PNG dan foto lanskap", async () => {
    const photo = await noisyPhoto(1800, 900, "png");
    const meta = await sharp(await renderOgImage(photo)).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["jpeg", OG_WIDTH, OG_HEIGHT]);
  });

  it("menolak data yang bukan gambar", async () => {
    await expect(renderOgImage(Buffer.from("bukan gambar"))).rejects.toThrow();
  });
});
