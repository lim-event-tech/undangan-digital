import { MAX_PHOTO_BYTES } from "@/lib/images";

const TARGET_BYTES = 1_500_000;
const START_QUALITY = 0.86;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.12;

export class KompresError extends Error {}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function kompresGambar(file: File, longestSide: number): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new KompresError("Foto tidak bisa dibaca. Gunakan file JPG atau PNG.");
  }

  const scale = Math.min(1, longestSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new KompresError("Peramban ini tidak bisa memproses foto.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let smallest: Blob | null = null;
  for (let quality = START_QUALITY; quality >= MIN_QUALITY; quality -= QUALITY_STEP) {
    const blob = await toBlob(canvas, quality);
    if (!blob) continue;
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= TARGET_BYTES) return blob;
  }

  if (smallest && smallest.size <= MAX_PHOTO_BYTES) return smallest;
  throw new KompresError("Foto terlalu besar. Pilih foto lain atau kecilkan ukurannya.");
}

export async function unggahFoto(
  file: File,
  kind: "cover" | "galeri",
): Promise<{ ok: true } | { ok: false; error: string }> {
  let blob: Blob;
  try {
    blob = await kompresGambar(file, kind === "cover" ? 2000 : 1600);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof KompresError ? error.message : "Foto tidak bisa diproses.",
    };
  }

  const body = new FormData();
  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  body.set("file", new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
  body.set("jenis", kind);

  try {
    const response = await fetch("/api/foto", { method: "POST", body });
    if (response.ok) return { ok: true };
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: data?.error ?? "Foto gagal diunggah. Coba lagi." };
  } catch {
    return { ok: false, error: "Foto gagal diunggah. Periksa koneksi, lalu coba lagi." };
  }
}
