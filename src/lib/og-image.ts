import sharp from "sharp";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_MAX_BYTES = 250_000;

const QUALITIES = [78, 68, 58, 48];

export async function renderOgImage(input: Buffer): Promise<Buffer> {
  const base = sharp(input, { failOn: "none" })
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "attention" })
    .flatten({ background: "#ffffff" });

  let output = Buffer.alloc(0);
  for (const quality of QUALITIES) {
    output = await base.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    if (output.length <= OG_MAX_BYTES) break;
  }
  return output;
}
