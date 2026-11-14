import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AgendaItem } from "@/lib/events/agenda";
import type { DayTime, Visit } from "@/lib/events/days";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    return Buffer.isBuffer(value) ? value : Buffer.from(value);
  },
});

const createdAt = () =>
  timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const adminRole = pgTable("admin_role", {
  key: text().primaryKey(),
  label: text().notNull(),
  permissions: jsonb().$type<string[]>().notNull().default([]),
  sortOrder: integer().notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  status: text({ enum: ["aktif", "diblokir"] })
    .notNull()
    .default("aktif"),
  adminRole: text().references(() => adminRole.key, { onDelete: "restrict" }),
  wabaAllowed: boolean("waba_allowed").notNull().default(false),
  wabaQuota: integer("waba_quota").notNull().default(0),
  wabaSentCount: integer("waba_sent_count").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const invitation = pgTable(
  "invitation",
  {
    id: uuid().defaultRandom().primaryKey(),
    ownerId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text().notNull().unique(),
    title: text().notNull(),
    templateKey: text().notNull().default("melati"),
    status: text({ enum: ["draf", "terbit", "ditangguhkan"] })
      .notNull()
      .default("draf"),
    content: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    defaultMaxAttendees: integer().notNull().default(1),
    rsvpDeadline: timestamp({ withTimezone: true }),
    checkinKey: text().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("invitation_owner_idx").on(t.ownerId),
    check(
      "invitation_default_max_ck",
      sql`${t.defaultMaxAttendees} between 1 and 40`,
    ),
  ],
);

export const event = pgTable(
  "event",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid()
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    key: text().notNull(),
    name: text().notNull(),
    sortOrder: integer().notNull().default(0),
    eventDate: date({ mode: "string" }),
    eventEndDate: date({ mode: "string" }),
    singleDayOnly: boolean().notNull().default(false),
    dayTimes: jsonb().$type<DayTime[]>().notNull().default([]),
    eventTime: time(),
    eventEndTime: time(),
    agenda: jsonb().$type<AgendaItem[]>().notNull().default([]),
    timezone: text({ enum: ["WIB", "WITA", "WIT"] })
      .notNull()
      .default("WIB"),
    venueName: text(),
    address: text(),
    mapsUrl: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("event_invitation_key_unique").on(t.invitationId, t.key)],
);

export const photo = pgTable(
  "photo",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid()
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    kind: text({ enum: ["cover", "galeri", "logo_penyelenggara", "logo_eo", "pengisi_acara", "poster_wa"] }).notNull(),
    sortOrder: integer().notNull().default(0),
    fileName: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: integer().notNull(),
    width: integer(),
    height: integer(),
    data: bytea().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("photo_invitation_idx").on(t.invitationId, t.kind),
    uniqueIndex("photo_logo_unique").on(t.invitationId, t.kind).where(sql`${t.kind} in ('logo_penyelenggara', 'logo_eo')`),
    uniqueIndex("photo_cover_unique")
      .on(t.invitationId)
      .where(sql`${t.kind} = 'cover'`),
  ],
);

export const music = pgTable("music", {
  id: uuid().defaultRandom().primaryKey(),
  invitationId: uuid()
    .notNull()
    .unique()
    .references(() => invitation.id, { onDelete: "cascade" }),
  fileName: text().notNull(),
  contentType: text().notNull(),
  sizeBytes: integer().notNull(),
  data: bytea().notNull(),
  createdAt: createdAt(),
});

export const guestGroup = pgTable(
  "guest_group",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid()
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    name: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique("guest_group_invitation_name_unique").on(t.invitationId, t.name)],
);

export const guest = pgTable(
  "guest",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid()
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    groupId: uuid().references(() => guestGroup.id, { onDelete: "set null" }),
    name: text().notNull(),
    phone: text().notNull(),
    token: text().notNull().unique(),
    maxAttendees: integer().notNull().default(1),
    sentAt: timestamp({ withTimezone: true }),
    firstOpenedAt: timestamp({ withTimezone: true }),
    lastRemindedAt: timestamp({ withTimezone: true }),
    addedBy: text().references(() => user.id, { onDelete: "set null" }),
    checkedInAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("guest_invitation_idx").on(t.invitationId),
    index("guest_invitation_phone_idx").on(t.invitationId, t.phone),
    index("guest_invitation_added_by_idx").on(t.invitationId, t.addedBy),
    check("guest_max_ck", sql`${t.maxAttendees} between 1 and 40`),
  ],
);

export const invitationMember = pgTable(
  "invitation_member",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid()
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contactName: text(),
    contactPhone: text(),
    contactEmail: text(),
    role: text().notNull().default("anggota"),
    checkinAccess: text().notNull().default("milik"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("invitation_member_unique").on(t.invitationId, t.userId),
    index("invitation_member_user_idx").on(t.userId),
  ],
);

export const invitationInvite = pgTable(
  "invitation_invite",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid()
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    email: text().notNull(),
    tokenHash: text().notNull().unique(),
    invitedBy: text().references(() => user.id, { onDelete: "set null" }),
    role: text().notNull().default("anggota"),
    checkinAccess: text().notNull().default("milik"),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    acceptedAt: timestamp({ withTimezone: true }),
    acceptedBy: text().references(() => user.id, { onDelete: "set null" }),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("invitation_invite_invitation_idx").on(t.invitationId)],
);

export const guestEvent = pgTable(
  "guest_event",
  {
    guestId: uuid()
      .notNull()
      .references(() => guest.id, { onDelete: "cascade" }),
    eventId: uuid()
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.guestId, t.eventId] }),
    index("guest_event_event_idx").on(t.eventId),
  ],
);

export const rsvp = pgTable(
  "rsvp",
  {
    id: uuid().defaultRandom().primaryKey(),
    guestId: uuid()
      .notNull()
      .references(() => guest.id, { onDelete: "cascade" }),
    eventId: uuid()
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    attending: boolean().notNull(),
    attendeeCount: integer().notNull().default(0),
    note: text(),
    visits: jsonb().$type<Visit[]>().notNull().default([]),
    respondedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("rsvp_guest_event_unique").on(t.guestId, t.eventId),
    check("rsvp_counts_ck", sql`${t.attendeeCount} between 0 and 40 and ((${t.attending} and ${t.attendeeCount} >= 1) or (not ${t.attending} and ${t.attendeeCount} = 0))`),
  ],
);

export const wish = pgTable(
  "wish",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid()
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    guestId: uuid().references(() => guest.id, { onDelete: "set null" }),
    authorName: text().notNull(),
    message: text().notNull(),
    status: text({ enum: ["tampil", "ditahan", "disembunyikan"] })
      .notNull()
      .default("tampil"),
    createdAt: createdAt(),
  },
  (t) => [
    index("wish_invitation_idx").on(t.invitationId),
    index("wish_guest_idx").on(t.guestId),
  ],
);

export const templateRegistry = pgTable("template_registry", {
  key: text().primaryKey(),
  label: text().notNull(),
  visible: boolean().notNull().default(false),
  sortOrder: integer().notNull().default(0),
  ribbon: text({ enum: ["Baru", "Populer", "Unggulan"] }),
  registeredAt: createdAt(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().defaultRandom().primaryKey(),
    actorId: text(),
    actorName: text().notNull(),
    category: text({
      enum: ["akun", "undangan", "template", "pengaturan", "tim", "sistem"],
    }).notNull(),
    action: text().notNull(),
    target: text().notNull().default(""),
    detail: text().notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

export const platformSetting = pgTable("platform_setting", {
  key: text().primaryKey(),
  value: jsonb().$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

export const waAuth = pgTable(
  "wa_auth",
  {
    sessionId: text().notNull().default("platform"),
    key: text().notNull(),
    value: text().notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.key] })],
);

export const waSession = pgTable("wa_session", {
  userId: text()
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  sambungOtomatis: boolean().notNull().default(false),
  nomor: text(),
  updatedAt: updatedAt(),
});

export const waJob = pgTable(
  "wa_job",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid()
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    guestId: uuid()
      .notNull()
      .references(() => guest.id, { onDelete: "cascade" }),
    kind: text({ enum: ["undangan", "pengingat"] }).notNull(),
    phone: text().notNull(),
    message: text().notNull(),
    posterId: uuid().references(() => photo.id, { onDelete: "set null" }),
    senderUserId: text().references(() => user.id, { onDelete: "set null" }),
    status: text({ enum: ["menunggu", "mengirim", "terkirim", "gagal", "dibatalkan"] })
      .notNull()
      .default("menunggu"),
    error: text(),
    createdAt: createdAt(),
    processedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("wa_job_status_idx").on(t.status, t.createdAt),
    index("wa_job_invitation_idx").on(t.invitationId),
    index("wa_job_sender_idx").on(t.senderUserId, t.status, t.createdAt),
    uniqueIndex("wa_job_active_unique")
      .on(t.guestId, t.kind)
      .where(sql`${t.status} in ('menunggu', 'mengirim')`),
  ],
);

export const wabaMessage = pgTable(
  "waba_message",
  {
    id: uuid().defaultRandom().primaryKey(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitation.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").references(() => guest.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientPhone: text("recipient_phone").notNull(),
    recipientName: text("recipient_name").notNull(),
    templateName: text("template_name").notNull(),
    status: text({ enum: ["pending", "processing", "sent", "delivered", "read", "failed"] })
      .notNull()
      .default("pending"),
    wamid: text(),
    wabaQueueId: text("waba_queue_id"),
    referenceId: text("reference_id"),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("waba_msg_invitation_idx").on(t.invitationId),
    index("waba_msg_user_idx").on(t.userId),
    index("waba_msg_guest_idx").on(t.guestId),
  ],
);
