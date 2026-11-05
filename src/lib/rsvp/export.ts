import { formatStamp } from "@/lib/datetime";
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

type Answer = { label: string; attendeeCount: number | string; note: string };

function eventAnswer(guest: DashboardGuest, eventId: string): Answer {
  if (!guest.invitedEventIds.includes(eventId)) return { label: "Tidak diundang", attendeeCount: "", note: "" };
  const answer = guest.answers.find((a) => a.eventId === eventId);
  if (!answer) return { label: "Belum menjawab", attendeeCount: "", note: "" };
  return answer.attending
    ? { label: "Hadir", attendeeCount: answer.attendeeCount, note: answer.note }
    : { label: "Tidak hadir", attendeeCount: "", note: answer.note };
}

export function buildRsvpRows(events: DashboardEvent[], guests: DashboardGuest[]): Rows {
  const header = [
    "Nama",
    "Grup",
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
      `${e.name}: pesan`,
    ]),
  ];

  const rows = guests.map((g) => [
    g.name,
    g.groupName ?? "",
    exportPhone(g.phone),
    STATUS_LABEL[g.status],
    g.status === "hadir" ? g.attendeeCount : "",
    stamp(g.sentAt),
    stamp(g.remindedAt),
    stamp(g.openedAt),
    stamp(g.respondedAt),
    ...events.flatMap((e) => {
      const answer = eventAnswer(g, e.id);
      return [answer.label, answer.attendeeCount, answer.note];
    }),
  ]);

  return [header, ...rows];
}

export function buildRsvpCsv(events: DashboardEvent[], guests: DashboardGuest[]): string {
  return toCsv(buildRsvpRows(events, guests));
}
