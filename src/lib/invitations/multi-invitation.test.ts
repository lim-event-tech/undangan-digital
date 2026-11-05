import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { listEventDetails, updateEvent } from "@/lib/events/service";
import { createGuest, deleteGuest, getGuest, listGuests } from "@/lib/guests/service";
import { getMusic, setMusic } from "@/lib/music/service";
import { addPhoto, listPhotos } from "@/lib/photos/service";
import { findGuestPage, submitRsvp } from "@/lib/rsvp/service";
import { deleteInvitation, publishInvitation, saveContentText, saveTitle } from "./editor";
import { createInvitation, getOwnedInvitation, listInvitationsForOwner } from "./service";

let db: TestDb;
beforeAll(async () => { db = await createTestDb(); });
afterAll(async () => { await db.$client.close(); });

function jpeg() {
  const bytes = Buffer.alloc(64, 7);
  bytes.set([0xff, 0xd8, 0xff]);
  return bytes;
}

it("memisahkan isi, acara, tamu, media, dan RSVP dua undangan dalam satu akun", async () => {
  const { ownerId, invitation: gathering } = await seedInvitation(db, { title: "Gathering", extraEvent: false });
  const workshop = await createInvitation(db, ownerId, { title: "Workshop", templateKey: "keraton" });
  const targets = [gathering, workshop];
  const guests = [];
  const eventIds: string[] = [];
  const fotoIds: string[] = [];

  for (const [i, target] of targets.entries()) {
    const current = await getOwnedInvitation(db, ownerId, target.id);
    expect(current?.id).toBe(target.id);
    const [event] = await listEventDetails(db, target.id);
    eventIds.push(event.id);
    await saveTitle(db, target.id, { title: `${target.title} Komunitas` });
    await saveContentText(db, target.id, { sambutan: `Sambutan ${target.title}` });
    await updateEvent(db, target.id, event.id, { name: `Sesi ${target.title}`, date: "2026-12-12", time: i === 0 ? "08:00" : "13:00", timezone: "WIB", venueName: `Aula ${target.title}`, address: "Bandung", mapsUrl: "https://maps.app.goo.gl/AbC123" });
    const foto = await addPhoto(db, target.id, { kind: "cover", fileName: `${target.slug}.jpg`, bytes: jpeg() });
    expect(foto.ok).toBe(true);
    if (!foto.ok) throw new Error("Foto gagal disimpan");
    fotoIds.push(foto.photo.id);
    expect((await setMusic(db, target.id, { fileName: `${target.slug}.mp3`, bytes: Buffer.from("ID3musik-contoh") })).ok).toBe(true);
    const guest = await createGuest(db, target.id, { name: `Tamu ${target.title}`, phone: "+6281200000123", groupName: "Anggota", eventIds: [event.id], maxAdults: i + 1, maxChildren: 0 });
    guests.push(guest);
    expect(await publishInvitation(db, target.id)).toEqual({ ok: true });
  }

  expect((await listInvitationsForOwner(db, ownerId)).map((row) => row.id).sort()).toEqual(targets.map((row) => row.id).sort());
  expect(await getGuest(db, gathering.id, guests[1].id)).toBeNull();
  expect(await deleteGuest(db, gathering.id, guests[1].id)).toBe(false);
  expect(await updateEvent(db, gathering.id, eventIds[1], { name: "Tertukar", date: "2026-12-12", time: "16:00", timezone: "WIB", venueName: "Salah", address: "Bandung", mapsUrl: "https://maps.app.goo.gl/AbC123" })).toBeNull();
  expect(await findGuestPage(db, gathering.slug, guests[1].token)).toBeNull();
  expect((await submitRsvp(db, { slug: gathering.slug, token: guests[1].token, read: () => ({ attending: "ya", adults: "1", children: "0", note: "" }) })).ok).toBe(false);

  expect((await submitRsvp(db, { slug: gathering.slug, token: guests[0].token, read: () => ({ attending: "ya", adults: "1", children: "0", note: "Hadir Gathering" }) })).ok).toBe(true);
  expect((await findGuestPage(db, workshop.slug, guests[1].token))?.events[0].response).toBeNull();
  expect((await submitRsvp(db, { slug: workshop.slug, token: guests[1].token, read: () => ({ attending: "tidak", adults: "0", children: "0", note: "Belum bisa" }) })).ok).toBe(true);

  for (const [i, target] of targets.entries()) {
    const page = await findGuestPage(db, target.slug, guests[i].token);
    expect(page?.invitation).toMatchObject({ title: `${target.title} Komunitas`, content: { sambutan: `Sambutan ${target.title}` }, templateKey: target.templateKey });
    expect(page?.events).toHaveLength(1);
    expect(page?.events[0]).toMatchObject({ id: eventIds[i], name: `Sesi ${target.title}`, response: { attending: i === 0, adults: i === 0 ? 1 : 0 } });
    expect((await listGuests(db, target.id)).map((guest) => guest.id)).toEqual([guests[i].id]);
    expect((await listPhotos(db, target.id)).map((foto) => foto.id)).toEqual([fotoIds[i]]);
    expect((await getMusic(db, target.id))?.fileName).toBe(`${target.slug}.mp3`);
  }
});

it("menghapus satu undangan tanpa menghapus undangan saudara atau akun pemilik", async () => {
  const { ownerId, invitation: first } = await seedInvitation(db, { title: "Event Pertama", extraEvent: false });
  const second = await createInvitation(db, ownerId, { title: "Event Kedua" });
  const other = await seedInvitation(db);
  const [firstEvent] = await listEventDetails(db, first.id);
  const [secondEvent] = await listEventDetails(db, second.id);
  const firstGuest = await createGuest(db, first.id, { name: "Tamu A", phone: "+6281200000456", groupName: null, eventIds: [firstEvent.id], maxAdults: 1, maxChildren: 0 });
  const secondGuest = await createGuest(db, second.id, { name: "Tamu B", phone: "+6281200000456", groupName: null, eventIds: [secondEvent.id], maxAdults: 1, maxChildren: 0 });

  expect(await deleteInvitation(db, other.invitation.id, ownerId)).toBe(false);
  expect(await deleteInvitation(db, first.id, ownerId)).toBe(true);
  expect(await getOwnedInvitation(db, ownerId, first.id)).toBeNull();
  expect(await getGuest(db, first.id, firstGuest.id)).toBeNull();
  expect((await getOwnedInvitation(db, ownerId, second.id))?.id).toBe(second.id);
  expect((await getGuest(db, second.id, secondGuest.id))?.name).toBe("Tamu B");
  expect((await listEventDetails(db, second.id)).map((event) => event.id)).toEqual([secondEvent.id]);
  expect((await getOwnedInvitation(db, other.ownerId, other.invitation.id))?.id).toBe(other.invitation.id);
  expect((await listInvitationsForOwner(db, ownerId)).map((row) => row.id)).toEqual([second.id]);
  expect((await createInvitation(db, ownerId, { title: "Event Pengganti" })).ownerId).toBe(ownerId);
});
