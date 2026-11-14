import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import {
  account,
  guest,
  invitation,
  rsvp,
  session,
  user,
} from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getMissingForPublish } from "@/lib/invitations/editor";

const WIB_HOURS = 7;

export type InvitationStatus = "draf" | "terbit" | "ditangguhkan";

export type DailyActivity = { date: string; opened: number; rsvp: number };

export type PlatformStats = {
  accounts: number;
  newAccounts: number;
  invitations: number;
  published: number;
  opened: number;
  rsvps: number;
  daily: DailyActivity[];
  funnel: { key: string; label: string; count: number }[];
  templates: { key: string; count: number }[];
};

function wibDay(value: Date): string {
  return new Date(value.getTime() + WIB_HOURS * 3_600_000).toISOString().slice(0, 10);
}

export async function getPlatformStats(
  db: AppDb,
  days: number,
  now: Date = new Date(),
): Promise<PlatformStats> {
  const since = new Date(now.getTime() - days * 86_400_000);

  const count = async (query: PromiseLike<{ total: number }[]>) => (await query)[0]?.total ?? 0;
  const totalOf = sql<number>`count(*)::int`;

  const [accounts, newAccounts, invitations, published] = await Promise.all([
    count(db.select({ total: totalOf }).from(user).where(isNull(user.adminRole))),
    count(
      db
        .select({ total: totalOf })
        .from(user)
        .where(and(isNull(user.adminRole), sql`${user.createdAt} >= ${since.toISOString()}::timestamptz`)),
    ),
    count(db.select({ total: totalOf }).from(invitation)),
    count(db.select({ total: totalOf }).from(invitation).where(eq(invitation.status, "terbit"))),
  ]);

  const openedRows = await db
    .select({
      day: sql<string>`to_char(${guest.firstOpenedAt} + interval '7 hours', 'YYYY-MM-DD')`,
      total: totalOf,
    })
    .from(guest)
    .where(sql`${guest.firstOpenedAt} >= ${since.toISOString()}::timestamptz`)
    .groupBy(sql`1`);

  const latest = db
    .select({ at: sql<Date>`max(${rsvp.respondedAt})`.as("at") })
    .from(rsvp)
    .groupBy(rsvp.guestId)
    .as("latest");
  const rsvpRows = await db
    .select({
      day: sql<string>`to_char(${latest.at} + interval '7 hours', 'YYYY-MM-DD')`,
      total: totalOf,
    })
    .from(latest)
    .where(sql`${latest.at} >= ${since.toISOString()}::timestamptz`)
    .groupBy(sql`1`);

  const openedBy = new Map(openedRows.map((row) => [row.day, row.total]));
  const rsvpBy = new Map(rsvpRows.map((row) => [row.day, row.total]));
  const daily: DailyActivity[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = wibDay(new Date(now.getTime() - offset * 86_400_000));
    daily.push({ date, opened: openedBy.get(date) ?? 0, rsvp: rsvpBy.get(date) ?? 0 });
  }

  const [creators, sentInvitations, answeredInvitations, templates] =
    await Promise.all([
      count(db.select({ total: sql<number>`count(distinct ${invitation.ownerId})::int` }).from(invitation)),
      count(
        db
          .select({ total: sql<number>`count(distinct ${guest.invitationId})::int` })
          .from(guest)
          .where(sql`${guest.sentAt} is not null`),
      ),
      count(
        db.select({ total: sql<number>`count(distinct ${guest.invitationId})::int` }).from(guest).where(
          sql`exists (select 1 from rsvp where rsvp.guest_id = ${guest.id})`,
        ),
      ),
      db
        .select({ key: invitation.templateKey, total: totalOf })
        .from(invitation)
        .groupBy(invitation.templateKey)
        .orderBy(desc(totalOf)),
    ]);

  const [openedTotal, rsvpTotal] = [
    daily.reduce((sum, d) => sum + d.opened, 0),
    daily.reduce((sum, d) => sum + d.rsvp, 0),
  ];

  return {
    accounts,
    newAccounts,
    invitations,
    published,
    opened: openedTotal,
    rsvps: rsvpTotal,
    daily,
    funnel: [
      { key: "daftar", label: "Mendaftar", count: accounts },
      { key: "buat", label: "Membuat undangan", count: creators },
      { key: "terbit", label: "Menerbitkan", count: published },
      { key: "kirim", label: "Mengirim link ke tamu", count: sentInvitations },
      { key: "rsvp", label: "Menerima RSVP pertama", count: answeredInvitations },
    ],
    templates: templates.map((row) => ({ key: row.key, count: row.total })),
  };
}

export const INVITATION_SORTS = ["terdekat", "terbaru", "tamu", "respons"] as const;
export type InvitationSort = (typeof INVITATION_SORTS)[number];

export function isInvitationSort(value: unknown): value is InvitationSort {
  return typeof value === "string" && (INVITATION_SORTS as readonly string[]).includes(value);
}

export type AdminInvitationRow = {
  id: string;
  slug: string;
  title: string;
  status: InvitationStatus;
  templateKey: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  eventDate: string | null;
  guests: number;
  sent: number;
  opened: number;
  responded: number;
  createdAt: Date;
};

const COUNTS = {
  guests: sql<number>`(select count(*)::int from guest where guest.invitation_id = ${invitation.id})`,
  sent: sql<number>`(select count(*)::int from guest where guest.invitation_id = ${invitation.id} and guest.sent_at is not null)`,
  opened: sql<number>`(select count(*)::int from guest where guest.invitation_id = ${invitation.id} and guest.first_opened_at is not null)`,
  responded: sql<number>`(select count(distinct rsvp.guest_id)::int from rsvp join guest on guest.id = rsvp.guest_id where guest.invitation_id = ${invitation.id})`,
  eventDate: sql<string | null>`(select min(event.event_date)::text from event where event.invitation_id = ${invitation.id})`,
};

export async function listInvitationsAdmin(
  db: AppDb,
  filters: {
    q?: string;
    status?: InvitationStatus;
    template?: string;
    sort?: InvitationSort;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{ rows: AdminInvitationRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = filters.pageSize ?? 25;
  const page = Math.max(1, Math.floor(filters.page ?? 1) || 1);

  const conditions = [];
  if (filters.status) conditions.push(eq(invitation.status, filters.status));
  if (filters.template) conditions.push(eq(invitation.templateKey, filters.template));
  const needle = filters.q?.trim().replace(/[%_\\]/g, "\\$&");
  if (needle) {
    const pattern = `%${needle}%`;
    conditions.push(
      or(
        ilike(invitation.slug, pattern),
        ilike(invitation.title, pattern),
        ilike(user.email, pattern),
        ilike(user.name, pattern),
      ),
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const order = {
    terdekat: [sql`${COUNTS.eventDate} asc nulls last`, desc(invitation.createdAt)],
    terbaru: [desc(invitation.createdAt)],
    tamu: [sql`${COUNTS.guests} desc`, desc(invitation.createdAt)],
    respons: [
      sql`case when ${COUNTS.guests} = 0 then 1 else 0 end asc`,
      sql`${COUNTS.responded}::float / nullif(${COUNTS.guests}, 0) asc nulls last`,
      desc(invitation.createdAt),
    ],
  }[filters.sort ?? "terbaru"];

  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(invitation)
    .innerJoin(user, eq(user.id, invitation.ownerId))
    .where(where);

  const rows = await db
    .select({
      id: invitation.id,
      slug: invitation.slug,
      title: invitation.title,
      status: invitation.status,
      templateKey: invitation.templateKey,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      eventDate: COUNTS.eventDate,
      guests: COUNTS.guests,
      sent: COUNTS.sent,
      opened: COUNTS.opened,
      responded: COUNTS.responded,
      createdAt: invitation.createdAt,
    })
    .from(invitation)
    .innerJoin(user, eq(user.id, invitation.ownerId))
    .where(where)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total: totalRow?.total ?? 0, page, pageSize };
}

export type AdminInvitationDetail = AdminInvitationRow & {
  rsvpDeadline: Date | null;
  events: number;
  photos: number;
  checkedIn: number;
  wabaAktif: boolean;
  ownerStatus: "aktif" | "diblokir";
  ownerCreatedAt: Date;
  ownerMethods: string[];
  ownerLastActive: Date | null;
  missing: string[];
};

export async function getInvitationAdmin(
  db: AppDb,
  id: string,
): Promise<AdminInvitationDetail | null> {
  const [row] = await db
    .select({
      id: invitation.id,
      slug: invitation.slug,
      title: invitation.title,
      status: invitation.status,
      templateKey: invitation.templateKey,
      rsvpDeadline: invitation.rsvpDeadline,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      ownerStatus: user.status,
      ownerCreatedAt: user.createdAt,
      eventDate: COUNTS.eventDate,
      guests: COUNTS.guests,
      sent: COUNTS.sent,
      opened: COUNTS.opened,
      responded: COUNTS.responded,
      events: sql<number>`(select count(*)::int from event where event.invitation_id = ${invitation.id})`,
      photos: sql<number>`(select count(*)::int from photo where photo.invitation_id = ${invitation.id} and photo.kind = 'cover')`,
      checkedIn: sql<number>`(select count(*)::int from guest where guest.invitation_id = ${invitation.id} and guest.checked_in_at is not null)`,
      wabaAktif: sql<boolean>`coalesce((${invitation.content} ->> 'wabaAktif')::boolean, true)`,
      createdAt: invitation.createdAt,
    })
    .from(invitation)
    .innerJoin(user, eq(user.id, invitation.ownerId))
    .where(eq(invitation.id, id))
    .limit(1);
  if (!row) return null;

  const [methods, active, missing] = await Promise.all([
    db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, row.ownerId)),
    db
      .select({ at: sql<Date | null>`max(${session.updatedAt})` })
      .from(session)
      .where(eq(session.userId, row.ownerId)),
    getMissingForPublish(db, id),
  ]);

  return {
    ...row,
    ownerMethods: methods.map((m) => (m.providerId === "credential" ? "Email dan kata sandi" : "Google")),
    ownerLastActive: active[0]?.at ? new Date(active[0].at) : null,
    missing: missing.map((m) => m.label),
  };
}

export async function setInvitationStatusAdmin(
  db: AppDb,
  id: string,
  action: "tangguhkan" | "aktifkan",
): Promise<InvitationStatus | null> {
  const [current] = await db
    .select({ status: invitation.status })
    .from(invitation)
    .where(eq(invitation.id, id));
  if (!current) return null;

  if (action === "tangguhkan") {
    await db.update(invitation).set({ status: "ditangguhkan" }).where(eq(invitation.id, id));
    return "ditangguhkan";
  }
  if (current.status !== "ditangguhkan") return current.status;
  const missing = await getMissingForPublish(db, id);
  const next: InvitationStatus = missing.length === 0 ? "terbit" : "draf";
  await db.update(invitation).set({ status: next }).where(eq(invitation.id, id));
  return next;
}

export async function adminDeleteInvitation(db: AppDb, id: string): Promise<boolean> {
  const rows = await db.delete(invitation).where(eq(invitation.id, id)).returning({ id: invitation.id });
  return rows.length > 0;
}

export async function adminSetDeadline(
  db: AppDb,
  id: string,
  deadline: Date | null,
): Promise<boolean> {
  const rows = await db
    .update(invitation)
    .set({ rsvpDeadline: deadline })
    .where(eq(invitation.id, id))
    .returning({ id: invitation.id });
  return rows.length > 0;
}

export const ACCOUNT_STATUSES = ["aktif", "diblokir"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === "string" && (ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export type AdminAccountRow = {
  id: string;
  name: string;
  email: string;
  status: AccountStatus;
  methods: string[];
  wabaAllowed: boolean;
  wabaQuota: number;
  wabaSentCount: number;
  createdAt: Date;
  lastActive: Date | null;
  invitationId: string | null;
  invitationSlug: string | null;
  invitationName: string | null;
  invitationStatus: InvitationStatus | null;
};

export type AccountStats = {
  total: number;
  google: number;
  email: number;
  active7: number;
  blocked: number;
};

export async function getAccountStats(db: AppDb, now: Date = new Date()): Promise<AccountStats> {
  const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      google: sql<number>`(count(*) filter (where exists (select 1 from account where account.user_id = "user".id and account.provider_id = 'google')))::int`,
      email: sql<number>`(count(*) filter (where exists (select 1 from account where account.user_id = "user".id and account.provider_id = 'credential')))::int`,
      active7: sql<number>`(count(*) filter (where exists (select 1 from session where session.user_id = "user".id and session.updated_at >= ${since}::timestamptz)))::int`,
      blocked: sql<number>`(count(*) filter (where "user".status = 'diblokir'))::int`,
    })
    .from(user)
    .where(isNull(user.adminRole));
  return row ?? { total: 0, google: 0, email: 0, active7: 0, blocked: 0 };
}

export async function listAccounts(
  db: AppDb,
  filters: {
    q?: string;
    method?: "google" | "email";
    status?: AccountStatus;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{ rows: AdminAccountRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = filters.pageSize ?? 25;
  const page = Math.max(1, Math.floor(filters.page ?? 1) || 1);

  const conditions = [isNull(user.adminRole)];
  if (filters.status) conditions.push(eq(user.status, filters.status));
  if (filters.method) {
    const provider = filters.method === "google" ? "google" : "credential";
    conditions.push(
      sql`exists (select 1 from account where account.user_id = ${user.id} and account.provider_id = ${provider})`,
    );
  }
  const needle = filters.q?.trim().replace(/[%_\\]/g, "\\$&");
  if (needle) {
    const pattern = `%${needle}%`;
    conditions.push(or(ilike(user.name, pattern), ilike(user.email, pattern))!);
  }
  const where = and(...conditions);

  const [totalRow] = await db.select({ total: sql<number>`count(*)::int` }).from(user).where(where);

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      wabaAllowed: user.wabaAllowed,
      wabaQuota: user.wabaQuota,
      wabaSentCount: user.wabaSentCount,
      createdAt: user.createdAt,
      lastActive: sql<Date | null>`(select max(session.updated_at) from session where session.user_id = ${user.id})`,
      providers: sql<string[]>`coalesce((select array_agg(account.provider_id) from account where account.user_id = ${user.id}), '{}')`,
      invitationId: invitation.id,
      invitationSlug: invitation.slug,
      title: invitation.title,
      invitationStatus: invitation.status,
    })
    .from(user)
    .leftJoin(invitation, eq(invitation.ownerId, user.id))
    .where(where)
    .orderBy(desc(user.createdAt), asc(user.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      methods: [...new Set(row.providers.map((p) => (p === "credential" ? "Email" : "Google")))],
      wabaAllowed: row.wabaAllowed,
      wabaQuota: row.wabaQuota,
      wabaSentCount: row.wabaSentCount,
      createdAt: row.createdAt,
      lastActive: row.lastActive ? new Date(row.lastActive) : null,
      invitationId: row.invitationId,
      invitationSlug: row.invitationSlug,
      invitationName: row.title ?? null,
      invitationStatus: row.invitationStatus,
    })),
    total: totalRow?.total ?? 0,
    page,
    pageSize,
  };
}

export async function setAccountStatus(
  db: AppDb,
  userId: string,
  status: AccountStatus,
): Promise<{ ok: boolean; suspended: number }> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(user)
      .set({ status })
      .where(and(eq(user.id, userId), isNull(user.adminRole)))
      .returning({ id: user.id });
    if (updated.length === 0) return { ok: false, suspended: 0 };

    let suspended = 0;
    if (status === "diblokir") {
      await tx.delete(session).where(eq(session.userId, userId));
      const rows = await tx
        .update(invitation)
        .set({ status: "ditangguhkan" })
        .where(and(eq(invitation.ownerId, userId), inArray(invitation.status, ["draf", "terbit"])))
        .returning({ id: invitation.id });
      suspended = rows.length;
    }
    return { ok: true, suspended };
  });
}
