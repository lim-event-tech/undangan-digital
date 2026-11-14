import { formatShortDay, formatStamp } from "@/lib/datetime";
import { CSV_DELIMITER, safeCell, toCsv, type Rows } from "@/lib/export/table";
import type { DashboardEvent, DashboardGuest, GuestStatus } from "./dashboard";

export { CSV_DELIMITER, safeCell };

const STATUS_LABEL: Record<GuestStatus, string> = {
  hadir: "Hadir",
  tidak: "Tidak hadir",
  belum: "Belum menjawab",
};

export function exportPhone(value: string): string {
  if (!value.startsWith("+62")) return value;
  const national = value.slice(3);
  const parts = [national.slice(0, 3), national.slice(3, 7), national.slice(7)].filter(Boolean);
  return `0${parts.join("-")}`;
}

function stamp(value: Date | null): string {
  return value ? formatStamp(value) : "";
}

type Answer = { label: string; attendeeCount: number | string; note: string; days: string };

function eventAnswer(guest: DashboardGuest, eventId: string): Answer {
  if (!guest.invitedEventIds.includes(eventId)) return { label: "Tidak diundang", attendeeCount: "", note: "", days: "" };
  const answer = guest.answers.find((a) => a.eventId === eventId);
  if (!answer) return { label: "Belum menjawab", attendeeCount: "", note: "", days: "" };
  return answer.attending
    ? {
        label: "Hadir",
        attendeeCount: answer.attendeeCount,
        note: answer.note,
        days: (answer.visits ?? []).map((v) => `${formatShortDay(v.date)}${v.time ? ` ${v.time.replace(":", ".")}` : ""}`).join("; "),
      }
    : { label: "Tidak hadir", attendeeCount: "", note: answer.note, days: "" };
}

export function buildRsvpRows(events: DashboardEvent[], guests: DashboardGuest[]): Rows {
  const header = [
    "Nama",
    "Grup",
    "Anggota tim yang mengundang",
    "Nomor WhatsApp",
    "Status",
    "Peserta hadir",
    "Terkirim",
    "Diingatkan",
    "Pertama dibuka",
    "Dijawab",
    ...events.flatMap((e) => [
      `${e.name}: jawaban`,
      `${e.name}: peserta`,
      `${e.name}: hari dan jam datang`,
      `${e.name}: pesan`,
    ]),
  ];

  const rows = guests.map((g) => [
    g.name,
    g.groupName ?? "",
    g.addedByName,
    exportPhone(g.phone),
    STATUS_LABEL[g.status],
    g.status === "hadir" ? g.attendeeCount : "",
    stamp(g.sentAt),
    stamp(g.remindedAt),
    stamp(g.openedAt),
    stamp(g.respondedAt),
    ...events.flatMap((e) => {
      const answer = eventAnswer(g, e.id);
      return [answer.label, answer.attendeeCount, answer.days, answer.note];
    }),
  ]);

  return [header, ...rows];
}

export function buildRsvpCsv(events: DashboardEvent[], guests: DashboardGuest[]): string {
  return toCsv(buildRsvpRows(events, guests));
}

export type FullExportEvent = {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  endTime: string | null;
  venueName: string | null;
  address: string | null;
};

export type FullExportMember = {
  name: string;
  email: string;
  role: string;
  checkinAccess: string;
  guests: number;
  contact: string;
  joinedAt: Date | null;
};

const CHECKIN_LABEL: Record<string, string> = {
  tidak: "Tanpa check-in",
  milik: "Tamu miliknya",
  semua: "Semua tamu",
};

export function buildAnswerRows(guests: DashboardGuest[], events: DashboardEvent[]): Rows {
  const header = ["Nama", "Anggota tim yang mengundang", "Sesi", "Jawaban", "Peserta", "Hari dan jam datang", "Pesan", "Dijawab"];
  const rows: Rows = [];
  for (const g of guests) {
    for (const e of events) {
      if (!g.invitedEventIds.includes(e.id)) continue;
      const answer = eventAnswer(g, e.id);
      const at = g.answers.find((a) => a.eventId === e.id)?.respondedAt ?? null;
      rows.push([g.name, g.addedByName, e.name, answer.label, answer.attendeeCount, answer.days, answer.note, stamp(at)]);
    }
  }
  return [header, ...rows];
}

export function buildCheckinRows(guests: DashboardGuest[]): Rows {
  const header = ["Nama", "Anggota tim yang mengundang", "Status RSVP", "Peserta hadir", "Sudah check-in", "Waktu check-in"];
  const rows = guests.map((g) => [
    g.name,
    g.addedByName,
    STATUS_LABEL[g.status],
    g.status === "hadir" ? g.attendeeCount : "",
    g.checkedInAt ? "Ya" : "Belum",
    stamp(g.checkedInAt),
  ]);
  return [header, ...rows];
}

export function buildEventRows(events: FullExportEvent[]): Rows {
  const header = ["Sesi", "Tanggal", "Jam mulai", "Jam selesai", "Tempat", "Alamat"];
  return [
    header,
    ...events.map((e) => [e.name, e.date ?? "", e.time ?? "", e.endTime ?? "", e.venueName ?? "", e.address ?? ""]),
  ];
}

export function buildTeamRows(members: FullExportMember[]): Rows {
  const header = ["Nama", "Email", "Peran", "Hak check-in", "Jumlah tamu", "Narahubung", "Bergabung"];
  return [
    header,
    ...members.map((m) => [m.name, m.email, m.role, CHECKIN_LABEL[m.checkinAccess] ?? m.checkinAccess, m.guests, m.contact, stamp(m.joinedAt)]),
  ];
}
