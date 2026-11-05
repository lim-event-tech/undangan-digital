import { describe, expect, it } from "vitest";
import { parseAgenda, readAgenda } from "./agenda";
import { parseEventForm } from "./form";
import { calendarSlots } from "@/lib/calendar";

const ID = "20000000-0000-4000-8000-000000000001";
function data(jam = "09:30") {
  const f = new FormData();
  for (const [key, value] of Object.entries({ nama: "Seminar", jam: "09:00", jamSelesai: "11:00", "agenda-id": ID, "agenda-jam": jam, "agenda-judul": "Paparan utama", "agenda-keterangan": "Diskusi peserta" })) f.set(key, value);
  return f;
}
describe("agenda dan rentang sesi", () => {
  it("menyimpan agenda sebagai rincian sesi yang terurut", () => {
    const f = data();
    f.append("agenda-id", "20000000-0000-4000-8000-000000000002"); f.append("agenda-jam", "10:00"); f.append("agenda-judul", "Diskusi");
    const parsed = parseEventForm(f);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.input.endTime).toBe("11:00");
      expect(parsed.input.agenda.map((item) => item.judul)).toEqual(["Paparan utama", "Diskusi"]);
    }
  });
  it.each(["08:59", "11:01", "25:00", ""])("menolak jam agenda %s", (jam) => {
    expect(parseEventForm(data(jam))).toMatchObject({ ok: false, errors: { "agenda-jam-0": expect.any(String) } });
  });
  it.each(["08:00", "09:00", "00:30"])("menolak jam selesai sebelum/sama mulai atau lintas hari %s", (end) => {
    const f = data(); f.set("jamSelesai", end);
    expect(parseEventForm(f)).toMatchObject({ ok: false, errors: { jamSelesai: expect.any(String) } });
  });
  it("menolak ID berulang dan agenda yang belum lengkap", () => {
    const f = data(); f.append("agenda-id", ID); f.append("agenda-jam", "10:00");
    expect(parseEventForm(f)).toMatchObject({ ok: false, errors: { agenda: expect.any(String), "agenda-judul-1": expect.any(String) } });
  });
  it("membatasi jumlah dan panjang agenda serta mengizinkan daftar kosong", () => {
    const f = data(); f.set("agenda-judul", "x".repeat(81));
    expect(parseEventForm(f).ok).toBe(false);
    expect(parseAgenda(new FormData(), "09:00", "11:00")).toEqual({ agenda: [], errors: {} });
    for (let i = 0; i < 20; i++) f.append("agenda-id", ID);
    expect(parseAgenda(f, "09:00", "11:00").errors.agenda).toContain("20");
  });
  it("membaca agenda JSON yang rusak tanpa membocorkan struktur tak dikenal", () => {
    expect(readAgenda(null)).toEqual([]);
    expect(readAgenda([null, { id: ID, jam: "09:30", judul: "Sesi", tambahan: "private" }, { id: ID, jam: "09:30", judul: "Duplikat" }])).toEqual([{ id: ID, jam: "09:30", judul: "Sesi", keterangan: "" }]);
  });
  it("menggunakan jam selesai aktual pada kalender dan durasi bawaan bila kosong", () => {
    const e = { id: ID, name: "Seminar", date: "2027-01-10", time: "09:00", endTime: "12:30", timezone: "WITA" as const, venueName: "Aula", address: null, mapsUrl: null };
    expect(calendarSlots([e], "Event")[0].end.toISOString()).toBe("2027-01-10T04:30:00.000Z");
    expect(calendarSlots([{ ...e, endTime: null }], "Event")[0].end.toISOString()).toBe("2027-01-10T03:00:00.000Z");
  });
});
