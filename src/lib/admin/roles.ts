export const SUPER_ROLE = "super";

export const PERMISSIONS = [
  "lihat",
  "lihat-tamu",
  "kelola-undangan",
  "ubah-undangan",
  "kelola-akun",
  "tangguhkan",
  "hapus",
  "template",
  "pengaturan",
  "tim",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ASSIGNABLE_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter((p) => p !== "tim");

export const PERMISSION_INFO: Record<Permission, { label: string; ket: string }> = {
  lihat: {
    label: "Melihat ringkasan, undangan, dan akun",
    ket: "Membuka daftar dan detail undangan serta akun pengguna. Selalu aktif untuk semua peran.",
  },
  "lihat-tamu": {
    label: "Melihat nama dan nomor tamu",
    ket: "Membuka daftar tamu setiap undangan dan mengunduhnya.",
  },
  "kelola-undangan": {
    label: "Mengelola seluruh isi undangan",
    ket: "Membuka undangan sebagai pengguna: isi, tamu, RSVP, ucapan, foto, musik, dan pengiriman.",
  },
  "ubah-undangan": {
    label: "Mengubah slug dan batas RSVP",
    ket: "Termasuk membuka slug yang terkunci setelah link terkirim.",
  },
  "kelola-akun": {
    label: "Mengubah akun pengguna",
    ket: "Mengubah nama dan email, serta mengganti kata sandi akun pengguna.",
  },
  tangguhkan: {
    label: "Menangguhkan undangan dan memblokir akun",
    ket: "Tamu melihat undangan tidak ditemukan selama ditangguhkan.",
  },
  hapus: {
    label: "Menghapus undangan secara permanen",
    ket: "Tidak bisa dibatalkan.",
  },
  template: {
    label: "Mengatur katalog template",
    ket: "Menampilkan, menyembunyikan, memberi label dan pita, serta mengurutkan template.",
  },
  pengaturan: {
    label: "Mengubah pengaturan platform",
    ket: "Pendaftaran, pengumuman, mode pemeliharaan, slug dicadangkan, dan pesan bawaan.",
  },
  tim: {
    label: "Mengelola tim admin dan peran",
    ket: "Hanya Super admin. Tidak bisa diberikan ke peran lain.",
  },
};

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (PERMISSIONS as readonly string[]).includes(value);
}

export function can(
  subject: { permissions: readonly string[] } | null | undefined,
  permission: Permission,
): boolean {
  return Boolean(subject) && subject!.permissions.includes(permission);
}

export function normalizePermissions(input: Iterable<unknown>): Permission[] {
  const wanted = new Set<Permission>(["lihat"]);
  for (const item of input) {
    if (isPermission(item) && ASSIGNABLE_PERMISSIONS.includes(item)) wanted.add(item);
  }
  return PERMISSIONS.filter((p) => wanted.has(p));
}

export const ROLE_LABEL_MAX = 40;

export function roleKeyFromLabel(label: string): string {
  const base = label
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");
  return base.length >= 2 ? base : "peran";
}

export type RoleInfo = {
  key: string;
  label: string;
  permissions: Permission[];
  members: number;
};
