import type { Visit } from "@/lib/events/days";
import { and, asc, eq } from "drizzle-orm";
import { guest, guestEvent, guestGroup, rsvp } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { listEventDetails } from "@/lib/events/service";
import {
  buildByGroup,
  buildDaily,
  buildFunnel,
  type DailyPoint,
  type FunnelStep,
  type GroupRow,
} from "./charts";

export type GuestStatus = "hadir" | "tidak" | "belum";

export const GUEST_STATUSES: readonly GuestStatus[] = ["hadir", "tidak", "belum"];

export function isGuestStatus(value: unknown): value is GuestStatus {
  return typeof value === "string" && (GUEST_STATUSES as readonly string[]).includes(value);
}

export type DashboardEvent = { id: string; name: string };

export type DashboardAnswer = {
  eventId: string;
  eventName: string;
  attending: boolean;
  attendeeCount: number;
  note: string;
  visits?: Visit[];
  respondedAt: Date;
};

export type DashboardGuest = {
  id: string;
  name: string;
  groupId: string | null;
  groupName: string | null;
  phone: string;
  sentAt: Date | null;
  openedAt: Date | null;
  remindedAt: Date | null;
  invitedEventIds: string[];
  status: GuestStatus;
  answers: DashboardAnswer[];
  attendeeCount: number;
  respondedAt: Date | null;
};

export type EventSummary = {
  eventId: string;
  name: string;
  invited: number;
  attending: number;
  notAttending: number;
  pending: number;
  attendeeCount: number;
};

export type DashboardTotals = {
  invited: number;
  attending: number;
  notAttending: number;
  pending: number;
  attendeeCount: number;
};

export type DashboardFilters = {
  status?: GuestStatus;
  groupId?: string;
  eventId?: string;
  q?: string;
};

export type DashboardCharts = {
  funnel: FunnelStep[];
  daily: DailyPoint[];
  groups: GroupRow[];
};

export type DashboardData = {
  totals: DashboardTotals;
  events: EventSummary[];
  guests: DashboardGuest[];
  matched: number;
  charts: DashboardCharts;
};

export type RawGuest = {
  id: string;
  name: string;
  groupId: string | null;
  groupName: string | null;
  phone?: string;
  sentAt?: Date | null;
  openedAt?: Date | null;
  remindedAt?: Date | null;
};
export type RawLink = { guestId: string; eventId: string };
export type RawResponse = {
  guestId: string;
  eventId: string;
  attending: boolean;
  attendeeCount: number;
  note: string | null;
  visits?: Visit[];
  respondedAt: Date;
};

function statusOf(invitedIds: string[], answered: DashboardAnswer[]): GuestStatus {
  if (answered.length === 0) return "belum";
  if (answered.some((a) => a.attending)) return "hadir";
  return answered.length >= invitedIds.length ? "tidak" : "belum";
}

export function buildDashboard(
  events: DashboardEvent[],
  guests: RawGuest[],
  links: RawLink[],
  responses: RawResponse[],
  filters: DashboardFilters = {},
): DashboardData {
  const eventName = new Map(events.map((e) => [e.id, e.name]));
  const eventOrder = new Map(events.map((e, index) => [e.id, index]));

  const invitedBy = new Map<string, string[]>();
  for (const link of links) {
    if (!eventName.has(link.eventId)) continue;
    const list = invitedBy.get(link.guestId) ?? [];
    list.push(link.eventId);
    invitedBy.set(link.guestId, list);
  }

  const answersBy = new Map<string, DashboardAnswer[]>();
  for (const r of responses) {
    const invited = invitedBy.get(r.guestId);
    if (!invited?.includes(r.eventId)) continue;
    const list = answersBy.get(r.guestId) ?? [];
    list.push({
      eventId: r.eventId,
      eventName: eventName.get(r.eventId) ?? "",
      attending: r.attending,
      attendeeCount: r.attendeeCount,
      note: r.note ?? "",
      visits: r.visits ?? [],
      respondedAt: r.respondedAt,
    });
    answersBy.set(r.guestId, list);
  }

  const summaries = new Map<string, EventSummary>(
    events.map((e) => [
      e.id,
      {
        eventId: e.id,
        name: e.name,
        invited: 0,
        attending: 0,
        notAttending: 0,
        pending: 0,
        attendeeCount: 0,
      },
    ]),
  );
  const totals: DashboardTotals = {
    invited: guests.length,
    attending: 0,
    notAttending: 0,
    pending: 0,
    attendeeCount: 0,
  };

  const built: DashboardGuest[] = guests.map((g) => {
    const invited = invitedBy.get(g.id) ?? [];
    const answers = (answersBy.get(g.id) ?? []).sort(
      (a, b) => (eventOrder.get(a.eventId) ?? 0) - (eventOrder.get(b.eventId) ?? 0),
    );
    const attendingAnswers = answers.filter((a) => a.attending);

    for (const id of invited) {
      const summary = summaries.get(id);
      if (!summary) continue;
      summary.invited += 1;
      const answer = answers.find((a) => a.eventId === id);
      if (!answer) summary.pending += 1;
      else if (answer.attending) {
        summary.attending += 1;
        summary.attendeeCount += answer.attendeeCount;
      } else summary.notAttending += 1;
    }

    const status = statusOf(invited, answers);
    const attendeeCount = attendingAnswers.reduce((max, a) => Math.max(max, a.attendeeCount), 0);
    if (status === "hadir") {
      totals.attending += 1;
      totals.attendeeCount += attendeeCount;
    } else if (status === "tidak") totals.notAttending += 1;
    else totals.pending += 1;

    const respondedAt = answers.reduce<Date | null>(
      (latest, a) => (!latest || a.respondedAt > latest ? a.respondedAt : latest),
      null,
    );
    return {
      id: g.id,
      name: g.name,
      groupId: g.groupId,
      groupName: g.groupName,
      phone: g.phone ?? "",
      sentAt: g.sentAt ?? null,
      openedAt: g.openedAt ?? null,
      remindedAt: g.remindedAt ?? null,
      invitedEventIds: invited,
      status,
      answers,
      attendeeCount,
      respondedAt,
    };
  });

  const needle = filters.q?.trim().toLowerCase();
  const filtered = built.filter((g) => {
    if (filters.groupId && g.groupId !== filters.groupId) return false;
    if (needle && !g.name.toLowerCase().includes(needle)) return false;
    if (filters.eventId) {
      if (!invitedBy.get(g.id)?.includes(filters.eventId)) return false;
      if (filters.status) {
        const answer = g.answers.find((a) => a.eventId === filters.eventId);
        const forEvent: GuestStatus = !answer ? "belum" : answer.attending ? "hadir" : "tidak";
        if (forEvent !== filters.status) return false;
      }
      return true;
    }
    return !filters.status || g.status === filters.status;
  });

  return {
    totals,
    events: events.map((e) => summaries.get(e.id)!),
    guests: filtered,
    matched: filtered.length,
    charts: {
      funnel: buildFunnel(built),
      daily: buildDaily(built),
      groups: buildByGroup(built),
    },
  };
}

export async function getDashboard(
  db: AppDb,
  invitationId: string,
  filters: DashboardFilters = {},
  addedBy?: string,
): Promise<DashboardData> {
  const scope = addedBy ? eq(guest.addedBy, addedBy) : undefined;
  const [events, guests, links, responses] = await Promise.all([
    listEventDetails(db, invitationId),
    db
      .select({
        id: guest.id,
        name: guest.name,
        groupId: guest.groupId,
        groupName: guestGroup.name,
        phone: guest.phone,
        sentAt: guest.sentAt,
        openedAt: guest.firstOpenedAt,
        remindedAt: guest.lastRemindedAt,
      })
      .from(guest)
      .leftJoin(guestGroup, eq(guest.groupId, guestGroup.id))
      .where(and(eq(guest.invitationId, invitationId), scope))
      .orderBy(asc(guest.createdAt), asc(guest.name)),
    db
      .select({ guestId: guestEvent.guestId, eventId: guestEvent.eventId })
      .from(guestEvent)
      .innerJoin(guest, eq(guestEvent.guestId, guest.id))
      .where(and(eq(guest.invitationId, invitationId), scope)),
    db
      .select({
        guestId: rsvp.guestId,
        eventId: rsvp.eventId,
        attending: rsvp.attending,
        attendeeCount: rsvp.attendeeCount,
        note: rsvp.note,
        visits: rsvp.visits,
        respondedAt: rsvp.respondedAt,
      })
      .from(rsvp)
      .innerJoin(guest, eq(rsvp.guestId, guest.id))
      .where(and(eq(guest.invitationId, invitationId), scope)),
  ]);

  return buildDashboard(
    events.map((e) => ({ id: e.id, name: e.name })),
    guests,
    links,
    responses,
    filters,
  );
}
