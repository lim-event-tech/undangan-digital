import QRCode from "qrcode";
import { db } from "@/db";
import { can } from "@/lib/admin/roles";
import { getAdmin } from "@/lib/session";
import { platformSummary } from "@/lib/wa/queue";
import { getWaManager } from "@/lib/wa/manager";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const admin = await getAdmin();
  if (!admin || !can(admin, "pengaturan")) {
    return Response.json({ error: "Tidak diizinkan" }, { status: 403, headers: NO_STORE });
  }
  const snapshot = getWaManager().snapshot();
  const qrImage = snapshot.qr
    ? await QRCode.toDataURL(snapshot.qr, { margin: 1, width: 280, errorCorrectionLevel: "M" })
    : null;
  const summary = await platformSummary(db);
  return Response.json(
    {
      status: snapshot.status,
      nomor: snapshot.nomor,
      galat: snapshot.galat,
      sejak: snapshot.sejak,
      qrImage,
      antrean: summary,
    },
    { headers: NO_STORE },
  );
}
