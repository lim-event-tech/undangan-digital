import type { Metadata } from "next";
import { judulHalaman, kartu } from "@/components/ui";
import { db } from "@/db";
import { formatStamp } from "@/lib/datetime";
import { isMailReady } from "@/lib/mail/send";
import { eq } from "drizzle-orm";
import { user as userTable } from "@/db/schema";
import { requireInvitationById } from "@/lib/session";
import { MAX_MEMBERS, listMembers, listPendingInvites } from "@/lib/team/service";
import { FormAturAnggota, FormUndang, TombolCabut, TombolKeluarkan } from "./form-tim";

export const metadata: Metadata = { title: "Tim" };

export default async function TimPage({ params }: PageProps<"/undangan/[id]/tim">) {
  const { invitation } = await requireInvitationById((await params).id);
  const [anggota, tertunda, surel, [pembuat]] = await Promise.all([
    listMembers(db, invitation.id),
    listPendingInvites(db, invitation.id),
    isMailReady(db),
    db.select({ name: userTable.name, email: userTable.email }).from(userTable).where(eq(userTable.id, invitation.ownerId)),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className={`m-0 ${judulHalaman}`}>Tim</h1>
        <p className="mt-1 mb-0 text-sm leading-relaxed text-redup">
          Undang orang lain, misalnya tim sales, untuk mengelola daftar undangan mereka sendiri. Setiap anggota hanya melihat tamu yang ia tambahkan, memakai nomor WhatsApp-nya sendiri untuk mengirim, dan bisa melakukan check-in untuk tamunya. Pemilik melihat semuanya. Pemilik tambahan setara dengan pembuat undangan, dan hak check-in tiap anggota diatur di sini.
        </p>
      </div>

      <section aria-labelledby="judul-undang" className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`}>
        <h2 id="judul-undang" className="m-0 font-judul text-2xl font-medium">Undang anggota</h2>
        {!surel ? (
          <p role="status" className="m-0 rounded-[10px] bg-krem p-3 text-sm leading-relaxed text-emas-tua">
            Pengiriman surel belum diaktifkan admin. Undangan tetap dibuat, dan tautannya bisa Anda salin lalu kirim sendiri.
          </p>
        ) : null}
        <FormUndang penuh={anggota.length + tertunda.length >= MAX_MEMBERS} />
      </section>

      <section aria-labelledby="judul-anggota" className={`${kartu} flex flex-col gap-3 p-5 sm:p-6`}>
        <h2 id="judul-anggota" className="m-0 font-judul text-2xl font-medium">Anggota ({anggota.length})</h2>
        {pembuat ? (
          <div className="flex flex-col rounded-[10px] bg-krem p-3">
            <span className="text-sm font-medium">{pembuat.name} <span className="text-xs font-normal text-emas-tua">Pembuat undangan</span></span>
            <span className="text-[13px] text-redup">{pembuat.email}</span>
          </div>
        ) : null}
        {anggota.length === 0 ? (
          <p className="m-0 text-sm text-redup-2">Belum ada anggota.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {anggota.map((a) => (
              <li key={a.userId} className="flex flex-wrap items-center justify-between gap-3 border-t border-garis-halus py-3 first:border-t-0">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{a.name}{a.role === "pemilik" ? <span className="ml-2 rounded-full bg-krem px-2 py-0.5 text-xs font-medium text-emas-tua">Pemilik</span> : null}</span>
                  <span className="text-[13px] text-redup">{a.email}</span>
                  <span className="text-xs text-redup-2">{a.guests} tamu · bergabung {formatStamp(a.joinedAt)}</span>
                  {a.contactName || a.contactPhone ? (
                    <span className="text-xs text-emas-tua">
                      Narahubung kustom: {[a.contactName, a.contactPhone, a.contactEmail].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <FormAturAnggota userId={a.userId} nama={a.name} peran={a.role} checkin={a.checkinAccess} />
                  <TombolKeluarkan userId={a.userId} nama={a.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tertunda.length > 0 ? (
        <section aria-labelledby="judul-tertunda" className={`${kartu} flex flex-col gap-3 p-5 sm:p-6`}>
          <h2 id="judul-tertunda" className="m-0 font-judul text-2xl font-medium">Menunggu diterima</h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {tertunda.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-garis-halus py-3 first:border-t-0">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{t.email}</span>
                  <span className="text-xs text-redup-2">Berlaku sampai {formatStamp(t.expiresAt)}</span>
                </div>
                <TombolCabut id={t.id} email={t.email} />
              </li>
            ))}
          </ul>
          <p className="m-0 text-xs text-redup">Untuk mengirim ulang, undang lagi alamat yang sama. Tautan lama otomatis tidak berlaku.</p>
        </section>
      ) : null}
    </div>
  );
}
