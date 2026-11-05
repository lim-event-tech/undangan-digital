import type { DashboardGuest } from "./dashboard";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const MAX_DAYS = 60;
const NO_GROUP = "Tanpa grup";

export type FunnelStep = { key: "diundang" | "terkirim" | "dibuka" | "menjawab" | "hadir"; label: string; count: number };

export type DailyPoint = { date: string; count: number };

export type GroupRow = {
  groupId: string | null;
  name: string;
  total: number;
  hadir: number;
  tidak: number;
  belum: number;
  attendeeCount: number;
};

export function buildFunnel(guests: DashboardGuest[]): FunnelStep[] {
  return [
    { key: "diundang", label: "Diundang", count: guests.length },
    { key: "terkirim", label: "Terkirim", count: guests.filter((g) => g.sentAt).length },
    { key: "dibuka", label: "Sudah membuka link", count: guests.filter((g) => g.openedAt).length },
    { key: "menjawab", label: "Sudah menjawab", count: guests.filter((g) => g.answers.length > 0).length },
    { key: "hadir", label: "Hadir", count: guests.filter((g) => g.status === "hadir").length },
  ];
}

function wibDay(value: Date): string {
  return new Date(value.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function buildDaily(guests: DashboardGuest[]): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const g of guests) {
    if (!g.respondedAt) continue;
    const day = wibDay(g.respondedAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const days = [...counts.keys()].sort();
  const last = days[days.length - 1];
  let first = days[0];
  const earliest = addDays(last, -(MAX_DAYS - 1));
  if (first < earliest) first = earliest;

  const points: DailyPoint[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) {
    points.push({ date: day, count: counts.get(day) ?? 0 });
  }
  return points;
}

export function buildByGroup(guests: DashboardGuest[]): GroupRow[] {
  const rows = new Map<string, GroupRow>();
  for (const g of guests) {
    const key = g.groupId ?? "";
    let row = rows.get(key);
    if (!row) {
      row = {
        groupId: g.groupId,
        name: g.groupName ?? NO_GROUP,
        total: 0,
        hadir: 0,
        tidak: 0,
        belum: 0,
        attendeeCount: 0,
      };
      rows.set(key, row);
    }
    row.total += 1;
    row[g.status] += 1;
    if (g.status === "hadir") {
      row.attendeeCount += g.attendeeCount;
    }
  }
  return [...rows.values()].sort((a, b) => {
    if (a.groupId === null && b.groupId !== null) return 1;
    if (b.groupId === null && a.groupId !== null) return -1;
    return b.total - a.total || a.name.localeCompare(b.name, "id");
  });
}
