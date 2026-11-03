import { describe, expect, it } from "vitest";
import { sniffImageType } from "./images";

describe("sniffImageType", () => {
  it("mengenali JPEG, PNG, dan WebP dari byte awal", () => {
    expect(sniffImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
    expect(
      sniffImageType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])),
    ).toBe("image/png");
    expect(
      sniffImageType(
        Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]),
      ),
    ).toBe("image/webp");
  });

  it("menolak GIF, teks, dan data yang terlalu pendek", () => {
    expect(sniffImageType(Buffer.from("GIF89a......"))).toBeNull();
    expect(sniffImageType(Buffer.from("<svg></svg>"))).toBeNull();
    expect(sniffImageType(Uint8Array.from([0xff, 0xd8]))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});
