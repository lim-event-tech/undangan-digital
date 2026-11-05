import { afterAll, beforeAll, expect, it } from "vitest";
import sharp from "sharp";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { createGuest } from "@/lib/guests/service";
import { listEventDetails, updateEvent } from "@/lib/events/service";
import { addPhoto, getPhotoData, listPhotos } from "@/lib/photos/service";
import { findGuestPage } from "@/lib/rsvp/service";
import { createInvitation } from "./service";
import { publishInvitation, saveContentText } from "./editor";

let db: TestDb;
beforeAll(async () => { db = await createTestDb(); });
afterAll(async () => { await db?.$client.close(); });

it("agenda dan data formal mengikuti undangan serta sesi yang ditujukan kepada tamu", async () => {
  const { ownerId, invitation: inv } = await seedInvitation(db);
  const sibling = await createInvitation(db, ownerId, { title: "Event saudara" });
  const sessions = await listEventDetails(db, inv.id);
  for (const [i, session] of sessions.entries()) {
    await updateEvent(db, inv.id, session.id, { name: session.name, date: "2027-02-20", time: "09:00", endTime: "11:00", timezone: "WIB", venueName: "Aula", address: "Bandung", mapsUrl: "https://maps.app.goo.gl/AbC123", agenda: [{ id: `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`, jam: "09:30", judul: `Agenda ${i}`, keterangan: "Rincian sesi" }] });
  }
  await saveContentText(db, inv.id, { penyelenggara: { nama: "Instansi A", namaEo: "EO B" }, kontak: { nama: "Panitia A", telepon: "+6281234567890", email: "panitia@example.com" } });
  const png = await sharp({ create: { width: 32, height: 18, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
  const logo = await addPhoto(db, inv.id, { kind: "logo_penyelenggara", fileName: "logo.png", bytes: png });
  expect(logo.ok).toBe(true);
  if (!logo.ok) throw new Error("Logo tidak tersimpan");
  expect((await getPhotoData(db, logo.photo.id))?.data).toEqual(png);
  expect((await listPhotos(db, sibling.id))).toEqual([]);
  expect(await publishInvitation(db, inv.id)).toMatchObject({ ok: false, reason: "belum-lengkap" });
  await addPhoto(db, inv.id, { kind: "cover", fileName: "cover.png", bytes: png });
  expect(await publishInvitation(db, inv.id)).toEqual({ ok: true });
  const guest = await createGuest(db, inv.id, { name: "Tamu satu sesi", phone: "+6281200000101", groupName: null, eventIds: [sessions[0].id], maxAttendees: 1,  });
  const page = await findGuestPage(db, inv.slug, guest.token);
  expect(page?.events).toHaveLength(1);
  expect(page?.events[0].agenda[0].judul).toBe("Agenda 0");
  expect(JSON.stringify(page?.events)).not.toContain("Agenda 1");
  expect(page?.invitation.content.kontak.nama).toBe("Panitia A");
  expect(await findGuestPage(db, sibling.slug, guest.token)).toBeNull();
  expect(await updateEvent(db, sibling.id, sessions[0].id, { ...sessions[0], agenda: [] })).toBeNull();
});
