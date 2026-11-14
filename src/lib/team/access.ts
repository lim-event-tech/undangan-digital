export type Role = "pemilik" | "anggota";
export type CheckinAccess = "tidak" | "milik" | "semua";

export const CHECKIN_ACCESS_OPTIONS: readonly { value: CheckinAccess; label: string }[] = [
  { value: "tidak", label: "Tanpa check-in" },
  { value: "milik", label: "Check-in tamu miliknya" },
  { value: "semua", label: "Check-in semua tamu" },
];

export const ROLE_OPTIONS: readonly { value: Role; label: string }[] = [
  { value: "anggota", label: "Anggota" },
  { value: "pemilik", label: "Pemilik" },
];

export function parseMemberRole(value: unknown): Role {
  return value === "pemilik" ? "pemilik" : "anggota";
}

export function parseCheckinAccess(value: unknown): CheckinAccess {
  return value === "tidak" || value === "semua" ? value : "milik";
}

export function effectiveCheckinAccess(role: Role, stored: unknown): CheckinAccess {
  return role === "pemilik" ? "semua" : parseCheckinAccess(stored);
}

export function checkinScope(access: CheckinAccess, scope: string | null): string | undefined {
  return access === "semua" ? undefined : (scope ?? undefined);
}
