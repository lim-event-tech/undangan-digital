import { and, count, desc, eq, inArray } from "drizzle-orm";
import { guest, rsvp, wish } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { readContent } from "@/lib/invitations/content";
import { findGuestRow } from "@/lib/rsvp/service";
import {
  WISH_MAX_LENGTH,
  WISH_MAX_PER_GUEST,
  WISH_PAGE_SIZE,
  cleanWish,
  type WishStatus,
} from "./shared";

export type SubmitWishResult =
  | { ok: true; status: WishStatus }
  | {
      ok: false;
      error:
        | "tidak-ditemukan"
        | "belum-terbit"
        | "dimatikan"
        | "kosong"
        | "terlalu-panjang"
        | "batas";
    };

export async function submitWish(
  db: AppDb,
  input: { slug: string; token: string; message: string },
): Promise<SubmitWishResult> {
  const row = await findGuestRow(db, input.slug, input.token);
  if (!row) return { ok: false, error: "tidak-ditemukan" };
  if (row.status !== "terbit") return { ok: false, error: "belum-terbit" };

  const settings = readContent(row.content).ucapan;
  if (!settings.tampil) return { ok: false, error: "dimatikan" };

  const message = cleanWish(input.message);
  if (message.length === 0) return { ok: false, error: "kosong" };
  if (message.length > WISH_MAX_LENGTH) return { ok: false, error: "terlalu-panjang" };

  const status: WishStatus = settings.tahan ? "ditahan" : "tampil";
  return db.transaction(async (tx) => {
    await tx.select({ id: guest.id }).from(guest).where(eq(guest.id, row.guestId)).for("update");
    const [existing] = await tx
      .select({ total: count() })
      .from(wish)
      .where(eq(wish.guestId, row.guestId));
    if ((existing?.total ?? 0) >= WISH_MAX_PER_GUEST) {
      return { ok: false, error: "batas" } as const;
    }
    await tx.insert(wish).values({
      invitationId: row.invitationId,
      guestId: row.guestId,
      authorName: row.guestName,
      message,
      status,
    });
    return { ok: true, status } as const;
  });
}

export type AuthorStatus = "hadir" | "tidak" | "belum";

export type PublicWish = {
  id: string;
  authorName: string;
  message: string;
  createdAt: Date;
  authorStatus: AuthorStatus;
};

async function withAuthorStatus(
  db: AppDb,
  rows: { id: string; guestId: string | null; authorName: string; message: string; createdAt: Date }[],
): Promise<PublicWish[]> {
  const guestIds = [...new Set(rows.map((r) => r.guestId).filter((id): id is string => id !== null))];
  const answers =
    guestIds.length === 0
      ? []
      : await db
          .select({ guestId: rsvp.guestId, attending: rsvp.attending })
          .from(rsvp)
          .where(inArray(rsvp.guestId, guestIds));
  const status = new Map<string, AuthorStatus>();
  for (const answer of answers) {
    if (answer.attending) status.set(answer.guestId, "hadir");
    else if (!status.has(answer.guestId)) status.set(answer.guestId, "tidak");
  }
  return rows.map(({ guestId, ...row }) => ({
    ...row,
    authorStatus: (guestId && status.get(guestId)) || "belum",
  }));
}

const PUBLIC_COLUMNS = {
  id: wish.id,
  guestId: wish.guestId,
  authorName: wish.authorName,
  message: wish.message,
  createdAt: wish.createdAt,
};

export async function listAllPublicWishes(
  db: AppDb,
  invitationId: string,
  limit = 48,
): Promise<PublicWish[]> {
  const rows = await db
    .select(PUBLIC_COLUMNS)
    .from(wish)
    .where(and(eq(wish.invitationId, invitationId), eq(wish.status, "tampil")))
    .orderBy(desc(wish.createdAt), desc(wish.id))
    .limit(limit);
  return withAuthorStatus(db, rows);
}

export type PublicWishPage = {
  items: PublicWish[];
  page: number;
  totalPages: number;
  total: number;
};

export async function listPublicWishes(
  db: AppDb,
  invitationId: string,
  page = 1,
): Promise<PublicWishPage> {
  const where = and(eq(wish.invitationId, invitationId), eq(wish.status, "tampil"));
  const [totalRow] = await db.select({ total: count() }).from(wish).where(where);
  const total = totalRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / WISH_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);

  const rows = await db
    .select(PUBLIC_COLUMNS)
    .from(wish)
    .where(where)
    .orderBy(desc(wish.createdAt), desc(wish.id))
    .limit(WISH_PAGE_SIZE)
    .offset((current - 1) * WISH_PAGE_SIZE);
  return { items: await withAuthorStatus(db, rows), page: current, totalPages, total };
}

export type OwnerWish = {
  id: string;
  authorName: string;
  message: string;
  status: WishStatus;
  createdAt: Date;
};

export async function listWishes(
  db: AppDb,
  invitationId: string,
  status?: WishStatus,
): Promise<OwnerWish[]> {
  return db
    .select({
      id: wish.id,
      authorName: wish.authorName,
      message: wish.message,
      status: wish.status,
      createdAt: wish.createdAt,
    })
    .from(wish)
    .where(
      status
        ? and(eq(wish.invitationId, invitationId), eq(wish.status, status))
        : eq(wish.invitationId, invitationId),
    )
    .orderBy(desc(wish.createdAt), desc(wish.id));
}

export async function countWishesByStatus(
  db: AppDb,
  invitationId: string,
): Promise<Record<WishStatus, number>> {
  const rows = await db
    .select({ status: wish.status, total: count() })
    .from(wish)
    .where(eq(wish.invitationId, invitationId))
    .groupBy(wish.status);
  const result: Record<WishStatus, number> = { tampil: 0, ditahan: 0, disembunyikan: 0 };
  for (const row of rows) result[row.status] = row.total;
  return result;
}

export async function setWishStatus(
  db: AppDb,
  invitationId: string,
  wishId: string,
  status: WishStatus,
): Promise<boolean> {
  const rows = await db
    .update(wish)
    .set({ status })
    .where(and(eq(wish.id, wishId), eq(wish.invitationId, invitationId)))
    .returning({ id: wish.id });
  return rows.length > 0;
}

export async function deleteWish(
  db: AppDb,
  invitationId: string,
  wishId: string,
): Promise<boolean> {
  const rows = await db
    .delete(wish)
    .where(and(eq(wish.id, wishId), eq(wish.invitationId, invitationId)))
    .returning({ id: wish.id });
  return rows.length > 0;
}
