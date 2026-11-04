import { beforeAll, expect, it } from "vitest";
import { user } from "@/db/schema";
import { createTestDb, type TestDb } from "@/test/db";
import { listEventDetails, updateEvent } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { addPhoto } from "@/lib/photos/service";
import { findGuestPage, submitRsvp } from "@/lib/rsvp/service";
import { publishInvitation, saveContentText, saveTitle } from "./editor";
import { createInvitation } from "./service";

let db: TestDb;
beforeAll(async () => { db = await createTestDb(); });

it("menjalankan alur event dari judul sampai penerbitan dan RSVP tamu tanpa profil mempelai", async () => {
  await db.insert(user).values({ id: "event-owner", name: "Pengguna", email: "event-owner@example.com" });
  const invitation = await createInvitation(db, "event-owner", { title: "  Seminar   Komunitas  " });
  expect(invitation).toMatchObject({ title: "Seminar Komunitas", slug: "seminar-komunitas", status: "draf" });
  const events = await listEventDetails(db, invitation.id);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ key: "utama", name: "Acara utama" });
  await saveContentText(db, invitation.id, { sambutan: "Mari berbagi inspirasi." });
  expect(await saveTitle(db, invitation.id, { title: "Seminar Komunitas Kreatif" })).toBe(true);
  expect(await saveTitle(db, invitation.id, { title: " " })).toBe(false);
  await updateEvent(db, invitation.id, events[0].id, { name: "Acara utama", date: "2026-12-12", time: "09:00", timezone: "WIB", venueName: "Aula Komunitas", address: "Bandung", mapsUrl: "https://maps.app.goo.gl/AbC123" });
  const bytes = Buffer.alloc(64, 7);
  bytes.set([0xff, 0xd8, 0xff]);
  expect((await addPhoto(db, invitation.id, { kind: "cover", fileName: "event.jpg", bytes })).ok).toBe(true);
  const guest = await createGuest(db, invitation.id, { name: "Tamu Seminar", phone: "+6281200000101", groupName: null, eventIds: [events[0].id], maxAdults: 1, maxChildren: 0 });
  expect(await publishInvitation(db, invitation.id)).toEqual({ ok: true });
  const before = await findGuestPage(db, invitation.slug, guest.token);
  expect(before?.invitation).toMatchObject({ title: "Seminar Komunitas Kreatif", slug: invitation.slug, status: "terbit", content: { sambutan: "Mari berbagi inspirasi." } });
  expect(before?.invitation.content).not.toHaveProperty("pria");
  expect(before?.invitation.content).not.toHaveProperty("wanita");
  const result = await submitRsvp(db, { slug: invitation.slug, token: guest.token, read: () => ({ attending: "ya", adults: "1", children: "0", note: "" }) });
  expect(result.ok).toBe(true);
  const after = await findGuestPage(db, invitation.slug, guest.token);
  expect(after?.events[0].response).toMatchObject({ attending: true, adults: 1, children: 0 });
});
