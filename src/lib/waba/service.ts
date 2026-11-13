import { and, desc, eq, sql } from "drizzle-orm";
import { auditLog, guest as guestTable, invitation as invitationTable, user as userTable, wabaMessage } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { appBaseUrl } from "@/lib/app-url";
import { formatDeadline } from "@/lib/datetime";
import { readContent } from "@/lib/invitations/content";
import { listPhotos } from "@/lib/photos/service";
import { getSettings } from "@/lib/platform/service";
import { DEFAULT_MESSAGE, deadlinePhrase, pickTemplate, renderMessage } from "@/lib/whatsapp";
import type { AdminUser } from "@/lib/session";
import { getWabaConfig } from "./config-service";
import { sendWabaNotification } from "./client";
import { buildWabaBodyParameters, formatWabaSingleVariableContent } from "./templates-guide";

export type UserWabaStatus = {
  allowed: boolean;
  quota: number;
  sentCount: number;
  wabaAllowed: boolean;
  wabaQuota: number;
  wabaSentCount: number;
};

export async function getUserWabaStatus(db: AppDb, userId: string): Promise<UserWabaStatus> {
  const [row] = await db
    .select({
      allowed: userTable.wabaAllowed,
      quota: userTable.wabaQuota,
      sentCount: userTable.wabaSentCount,
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  const allowed = row?.allowed ?? false;
  const quota = row?.quota ?? 0;
  const sentCount = row?.sentCount ?? 0;

  return {
    allowed,
    quota,
    sentCount,
    wabaAllowed: allowed,
    wabaQuota: quota,
    wabaSentCount: sentCount,
  };
}

export type UpdateUserWabaQuotaPatch = {
  allowed?: boolean;
  wabaAllowed?: boolean;
  deltaQuota?: number;
  setQuota?: number;
  mode?: "tambah" | "kurang" | "atur";
  jumlah?: number;
};

export async function updateUserWabaQuota(
  db: AppDb,
  admin: AdminUser,
  targetUserId: string,
  patch: UpdateUserWabaQuotaPatch,
): Promise<{ ok: true; quota: number; allowed: boolean } | { ok: false; error: string }> {
  const [target] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      allowed: userTable.wabaAllowed,
      quota: userTable.wabaQuota,
    })
    .from(userTable)
    .where(eq(userTable.id, targetUserId));

  if (!target) return { ok: false, error: "Akun pengguna tidak ditemukan" };

  const rawAllowed = patch.allowed ?? patch.wabaAllowed;
  const newAllowed = typeof rawAllowed === "boolean" ? rawAllowed : target.allowed;
  let newQuota = target.quota;

  if (patch.mode && typeof patch.jumlah === "number") {
    if (patch.mode === "atur") {
      newQuota = Math.max(0, Math.round(patch.jumlah));
    } else if (patch.mode === "tambah") {
      newQuota = Math.max(0, target.quota + Math.round(patch.jumlah));
    } else if (patch.mode === "kurang") {
      newQuota = Math.max(0, target.quota - Math.round(patch.jumlah));
    }
  } else if (typeof patch.setQuota === "number" && Number.isFinite(patch.setQuota)) {
    newQuota = Math.max(0, Math.round(patch.setQuota));
  } else if (typeof patch.deltaQuota === "number" && Number.isFinite(patch.deltaQuota)) {
    newQuota = Math.max(0, target.quota + Math.round(patch.deltaQuota));
  }

  await db
    .update(userTable)
    .set({
      wabaAllowed: newAllowed,
      wabaQuota: newQuota,
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, targetUserId));

  // Catat ke audit log
  const detailParts = [];
  if (newAllowed !== target.allowed) {
    detailParts.push(`Status WABA: ${newAllowed ? "Diizinkan" : "Dinonaktifkan"}`);
  }
  if (newQuota !== target.quota) {
    const delta = newQuota - target.quota;
    detailParts.push(`Kredit: ${target.quota} -> ${newQuota} (${delta >= 0 ? "+" + delta : delta})`);
  }

  if (detailParts.length > 0) {
    await db.insert(auditLog).values({
      actorId: admin.id,
      actorName: admin.name,
      category: "akun",
      action: "ubah_kuota_waba",
      target: target.email,
      detail: detailParts.join(", "),
    });
  }

  return { ok: true, quota: newQuota, allowed: newAllowed };
}

export type SendWabaInviteParams = {
  invitationId: string;
  guestId: string;
  senderUserId: string;
  templateOverride?: string;
  templateBodyText?: string;
  templateHeaderFormat?: "NONE" | "TEXT" | "IMAGE" | "DOCUMENT";
  templateHasButtons?: boolean;
  kind?: "undangan" | "pengingat";
};

export async function resolveInvitationHeaderImageUrl(
  db: AppDb,
  invitationId: string,
  content: ReturnType<typeof readContent>,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const photos = await listPhotos(db, invitationId);

  if (content.waPoster.kirim && content.waPoster.sumber === "khusus") {
    const poster = photos.find((p) => p.kind === "poster_wa");
    if (!poster) {
      return {
        ok: false,
        error:
          "Poster khusus WhatsApp belum diunggah. Unggah poster khusus di halaman Kirim Undangan atau matikan pilihan poster khusus.",
      };
    }
    return { ok: true, url: `${appBaseUrl()}/foto/${poster.id}` };
  }

  const coverOrPoster =
    photos.find((p) => p.kind === "cover") || photos.find((p) => p.kind === "poster_wa");
  if (!coverOrPoster) {
    return {
      ok: false,
      error:
        "Foto sampul atau poster undangan belum diunggah untuk header gambar WhatsApp. Unggah foto sampul di menu Isi Undangan.",
    };
  }

  return { ok: true, url: `${appBaseUrl()}/foto/${coverOrPoster.id}` };
}

export type SendWabaInviteResult =
  | { ok: true; messageId: string; remainingQuota: number }
  | { ok: false; error: string; code?: "NO_CREDIT" | "NOT_ALLOWED" | "NOT_CONFIGURED" | "GATEWAY_ERROR" };

export async function sendGuestInvitationViaWaba(
  db: AppDb,
  params: SendWabaInviteParams,
): Promise<SendWabaInviteResult> {
  const config = await getWabaConfig(db);
  if (!config.aktif || !config.apiKey) {
    return {
      ok: false,
      code: "NOT_CONFIGURED",
      error: "Layanan WhatsApp Business API (WABA) belum diaktifkan oleh administrator.",
    };
  }

  // Ambil data invitation & owner
  const [invRow] = await db
    .select({
      invitation: invitationTable,
      owner: userTable,
    })
    .from(invitationTable)
    .innerJoin(userTable, eq(userTable.id, invitationTable.ownerId))
    .where(eq(invitationTable.id, params.invitationId));

  if (!invRow) return { ok: false, error: "Undangan tidak ditemukan." };

  const owner = invRow.owner;

  // Cek apakah akun pengirim memiliki hak WABA, atau pemilik undangan
  const [senderUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, params.senderUserId));

  const payer = senderUser?.wabaAllowed ? senderUser : (owner.wabaAllowed ? owner : null);

  if (!payer) {
    return {
      ok: false,
      code: "NOT_ALLOWED",
      error: "Akun Anda belum diizinkan menggunakan sistem WABA resmi. Silakan hubungi admin.",
    };
  }

  if (payer.wabaQuota <= 0) {
    return {
      ok: false,
      code: "NO_CREDIT",
      error: "Kredit pesan WABA resmi Anda sudah habis. Silakan hubungi admin untuk penambahan kredit.",
    };
  }

  // Ambil tamu
  const [guest] = await db
    .select()
    .from(guestTable)
    .where(and(eq(guestTable.id, params.guestId), eq(guestTable.invitationId, params.invitationId)));

  if (!guest) return { ok: false, error: "Tamu tidak ditemukan." };
  if (!guest.phone) return { ok: false, error: "Nomor telepon tamu belum diisi." };

  const content = readContent(invRow.invitation.content);
  const templateName =
    params.templateOverride ||
    content.wabaTemplate ||
    config.defaultTemplate ||
    "lim_undangan_resmi";

  // Header image (sesuai pengiriman Baileys: poster khusus jika diaktifkan, atau cover)
  const isImageHeader = params.templateHeaderFormat !== "NONE" && params.templateHeaderFormat !== "TEXT";
  let headerPayload: { type: "image"; mediaUrl: string } | undefined;
  if (isImageHeader) {
    const headerImgRes = await resolveInvitationHeaderImageUrl(db, invRow.invitation.id, content);
    if (!headerImgRes.ok) {
      return {
        ok: false,
        error: headerImgRes.error,
      };
    }
    headerPayload = {
      type: "image",
      mediaUrl: headerImgRes.url,
    };
  }

  // Kurangi 1 kredit dan tambah 1 ke waba_sent_count secara atomik pada akun penanggung
  const [updatedUser] = await db
    .update(userTable)
    .set({
      wabaQuota: sql`${userTable.wabaQuota} - 1`,
      wabaSentCount: sql`${userTable.wabaSentCount} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(userTable.id, payer.id), sql`${userTable.wabaQuota} > 0`))
    .returning({ quota: userTable.wabaQuota });

  if (!updatedUser) {
    return {
      ok: false,
      code: "NO_CREDIT",
      error: "Kredit pesan WABA resmi tidak mencukupi.",
    };
  }

  // Siapkan teks pesan sesuai template yang dibuat pengguna di halaman pengiriman
  const settings = await getSettings(db);
  const templateText = pickTemplate(params.kind ?? "undangan", content, settings.pesanWaBawaan || DEFAULT_MESSAGE);
  const deadlineText = formatDeadline(invRow.invitation.rsvpDeadline);
  const phrase = deadlinePhrase(deadlineText);
  const link = `${appBaseUrl()}/${guest.token}`;

  const renderedMessage = renderMessage(templateText, {
    nama: guest.name,
    link,
    batas_rsvp: phrase,
    event: invRow.invitation.title,
  });

  // 1 variabel konten yang digabung tanpa line break
  const singleVarContent = formatWabaSingleVariableContent(renderedMessage);

  const bodyParams =
    params.templateBodyText && /\{\{2\}\}/.test(params.templateBodyText)
      ? buildWabaBodyParameters(params.templateBodyText, {
          guestName: guest.name,
          eventTitle: invRow.invitation.title,
          deadlinePhrase: phrase,
          link,
          token: guest.token,
          fullMessage: renderedMessage,
        })
      : [singleVarContent];

  // Tombol: tanpa tombol untuk format standar LIM-RSVP
  const buttonPayload = params.templateHasButtons
    ? [
        {
          index: 0,
          type: "url" as const,
          parameter: guest.token,
        },
      ]
    : undefined;

  // Kirim ke Gateway WABA
  const sendRes = await sendWabaNotification(config, {
    to: guest.phone,
    recipientName: guest.name,
    template: templateName,
    referenceId: guest.id,
    parameters: {
      ...(headerPayload ? { header: headerPayload } : {}),
      body: bodyParams,
      ...(buttonPayload ? { buttons: buttonPayload } : {}),
    },
  });

  if (!sendRes.ok) {
    // Refund kredit jika gagal dikirim
    await db
      .update(userTable)
      .set({
        wabaQuota: sql`${userTable.wabaQuota} + 1`,
        wabaSentCount: sql`GREATEST(0, ${userTable.wabaSentCount} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, payer.id));

    // Catat kegagalan di wabaMessage
    await db.insert(wabaMessage).values({
      invitationId: params.invitationId,
      guestId: guest.id,
      userId: params.senderUserId,
      recipientPhone: guest.phone,
      recipientName: guest.name,
      templateName,
      status: "failed",
      lastError: sendRes.error,
    });

    return {
      ok: false,
      code: "GATEWAY_ERROR",
      error: `Gagal mengirim via WABA: ${sendRes.error}`,
    };
  }

  const now = new Date();

  // Catat ke tabel waba_message
  const [msg] = await db
    .insert(wabaMessage)
    .values({
      invitationId: params.invitationId,
      guestId: guest.id,
      userId: params.senderUserId,
      recipientPhone: guest.phone,
      recipientName: guest.name,
      templateName,
      status: "sent",
      wabaQueueId: sendRes.data.id,
      referenceId: guest.id,
      sentAt: now,
    })
    .returning({ id: wabaMessage.id });

  // Tandai tamu terkirim
  await db
    .update(guestTable)
    .set({
      sentAt: now,
      updatedAt: now,
    })
    .where(eq(guestTable.id, guest.id));

  return {
    ok: true,
    messageId: msg.id,
    remainingQuota: updatedUser.quota,
  };
}

export async function listWabaMessages(
  db: AppDb,
  invitationId: string,
  limit = 20,
) {
  return db
    .select()
    .from(wabaMessage)
    .where(eq(wabaMessage.invitationId, invitationId))
    .orderBy(desc(wabaMessage.createdAt))
    .limit(limit);
}

export type BatchWabaResult = {
  ok: boolean;
  totalSent: number;
  totalFailed: number;
  remainingQuota: number;
  error?: string;
};

export async function sendBatchInvitationViaWaba(
  db: AppDb,
  params: {
    invitationId: string;
    senderUserId: string;
    addedBy?: string;
    limit?: number;
    templateOverride?: string;
    templateBodyText?: string;
    templateHeaderFormat?: "NONE" | "TEXT" | "IMAGE" | "DOCUMENT";
    templateHasButtons?: boolean;
    kind?: "undangan" | "pengingat";
  },
): Promise<BatchWabaResult> {
  const [invRow] = await db
    .select({
      invitation: invitationTable,
      owner: userTable,
    })
    .from(invitationTable)
    .innerJoin(userTable, eq(userTable.id, invitationTable.ownerId))
    .where(eq(invitationTable.id, params.invitationId));

  if (!invRow) return { ok: false, totalSent: 0, totalFailed: 0, remainingQuota: 0, error: "Undangan tidak ditemukan." };

  const owner = invRow.owner;

  const [senderUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, params.senderUserId));

  const payer = senderUser?.wabaAllowed ? senderUser : (owner.wabaAllowed ? owner : null);

  if (!payer) {
    return {
      ok: false,
      totalSent: 0,
      totalFailed: 0,
      remainingQuota: 0,
      error: "Akun Anda belum diizinkan menggunakan sistem WABA resmi.",
    };
  }

  if (payer.wabaQuota <= 0) {
    return {
      ok: false,
      totalSent: 0,
      totalFailed: 0,
      remainingQuota: 0,
      error: "Kredit pesan WABA resmi Anda sudah habis.",
    };
  }

  // Cari tamu yang belum terkirim dan memiliki nomor telepon
  const conditions = [
    eq(guestTable.invitationId, params.invitationId),
    sql`${guestTable.sentAt} IS NULL`,
    sql`TRIM(COALESCE(${guestTable.phone}, '')) <> ''`,
  ];
  if (params.addedBy) {
    conditions.push(eq(guestTable.addedBy, params.addedBy));
  }

  const guests = await db
    .select({ id: guestTable.id, name: guestTable.name, phone: guestTable.phone })
    .from(guestTable)
    .where(and(...conditions))
    .orderBy(guestTable.createdAt)
    .limit(params.limit ?? Math.min(payer.wabaQuota, 200));

  if (guests.length === 0) {
    return {
      ok: true,
      totalSent: 0,
      totalFailed: 0,
      remainingQuota: payer.wabaQuota,
    };
  }

  let totalSent = 0;
  let totalFailed = 0;
  let remainingQuota = payer.wabaQuota;

  for (const g of guests) {
    if (remainingQuota <= 0) break;
    const res = await sendGuestInvitationViaWaba(db, {
      invitationId: params.invitationId,
      guestId: g.id,
      senderUserId: params.senderUserId,
      templateOverride: params.templateOverride,
      templateBodyText: params.templateBodyText,
      templateHeaderFormat: params.templateHeaderFormat,
      templateHasButtons: params.templateHasButtons,
      kind: params.kind,
    });
    if (res.ok) {
      totalSent++;
      remainingQuota = res.remainingQuota;
    } else {
      totalFailed++;
      if (res.code === "NO_CREDIT") {
        break;
      }
    }
  }

  return {
    ok: totalSent > 0 || totalFailed === 0,
    totalSent,
    totalFailed,
    remainingQuota,
  };
}
