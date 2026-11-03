export const MAX_MUSIC_BYTES = 6 * 1024 * 1024;

export type AudioType = "audio/mpeg" | "audio/mp4" | "audio/ogg";

export function sniffAudioType(bytes: Uint8Array): AudioType | null {
  if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return "audio/mpeg";
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return "audio/mpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return "audio/mp4";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return "audio/ogg";
  }
  return null;
}

export type ByteRange = { start: number; end: number };

export function parseRange(header: string | null, size: number): ByteRange | "tidak-valid" | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size <= 0) return "tidak-valid";
  const [, from, to] = match;
  if (from === "" && to === "") return "tidak-valid";

  if (from === "") {
    const suffix = Number(to);
    if (suffix === 0) return "tidak-valid";
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(from);
  const end = to === "" ? size - 1 : Math.min(Number(to), size - 1);
  if (start >= size || end < start) return "tidak-valid";
  return { start, end };
}
