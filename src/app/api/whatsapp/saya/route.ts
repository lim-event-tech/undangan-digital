import QRCode from "qrcode";
import { db } from "@/db";
import { getSession } from "@/lib/session";
import { getWaManager } from "@/lib/wa/manager";
import { senderSummary } from "@/lib/wa/queue";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getSession();
  if (!session || session.user.status === "diblokir" || session.user.adminRole) {
    return Response.json({ error: "Tidak diizinkan" }, { status: 403, headers: NO_STORE });
  }
  const snapshot = getWaManager().for(session.user.id).snapshot();
  const qrImage = snapshot.qr
    ? await QRCode.toDataURL(snapshot.qr, { margin: 1, width: 280, errorCorrectionLevel: "M" })
    : null;
  return Response.json(
    {
      status: snapshot.status,
      nomor: snapshot.nomor,
      galat: snapshot.galat,
      sejak: snapshot.sejak,
      qrImage,
      antrean: await senderSummary(db, session.user.id),
    },
    { headers: NO_STORE },
  );
}
