import { describe, expect, it } from "vitest";
import { readContent } from "./content";
import { parseFormalForm } from "./formal-form";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
const ID = "10000000-0000-4000-8000-000000000001";

describe("data formal untuk EO", () => {
  it("merapikan identitas dan memisahkan pemilik acara dari EO", () => {
    expect(parseFormalForm("identitas", form({ jenis: " Rapat   Kerja ", subjudul: "Tema", deskripsi: " Agenda\r\n\r\nDiskusi " }))).toEqual({ ok: true, input: { identitas: { jenis: "Rapat Kerja", subjudul: "Tema", deskripsi: "Agenda\n\nDiskusi" } } });
    expect(parseFormalForm("penyelenggara", form({ nama: "Instansi A", namaEo: "EO B" }))).toEqual({ ok: true, input: { penyelenggara: { nama: "Instansi A", namaEo: "EO B" } } });
  });
  it.each(["identitas", "penyelenggara", "informasiPeserta", "kontak"])("mengizinkan bagian %s dikosongkan dalam draf", (group) => {
    expect(parseFormalForm(group, form({})).ok).toBe(true);
  });
  it("menolak bagian asing dan nilai panjang sebelum menyimpan", () => {
    expect(parseFormalForm("__proto__", form({})).ok).toBe(false);
    expect(parseFormalForm("amplop", form({})).ok).toBe(false);
    expect(parseFormalForm("identitas", form({ jenis: "x".repeat(61), deskripsi: "x".repeat(1201) }))).toMatchObject({ ok: false, errors: { jenis: expect.any(String), deskripsi: expect.any(String) } });
  });
  it("menormalkan kontak dan mewajibkan nama serta kanal kontak", () => {
    expect(parseFormalForm("kontak", form({ nama: "  Panitia ", telepon: "081234567890", email: "Panitia@Example.com" }))).toEqual({ ok: true, input: { kontak: { nama: "Panitia", telepon: "+6281234567890", email: "panitia@example.com" } } });
    expect(parseFormalForm("kontak", form({ nama: "Panitia" })).ok).toBe(false);
    expect(parseFormalForm("kontak", form({ email: "panitia@example.com" })).ok).toBe(false);
    expect(parseFormalForm("kontak", form({ nama: "Panitia", email: "javascript:alert(1)" })).ok).toBe(false);
    expect(parseFormalForm("kontak", form({ nama: "Panitia", telepon: "+123456789012" })).ok).toBe(false);
  });
  it("menyimpan urutan pengisi acara dengan ID tetap dan menolak ID berulang", () => {
    const data = form({ id: ID, nama: "Narasumber", peran: "Pembicara", instansi: "Instansi", profil: "Profil singkat" });
    expect(parseFormalForm("pengisiAcara", data)).toMatchObject({ ok: true, input: { pengisiAcara: [{ id: ID, nama: "Narasumber" }] } });
    data.append("id", ID);
    data.append("nama", "Moderator");
    expect(parseFormalForm("pengisiAcara", data)).toMatchObject({ ok: false, errors: { pengisiAcara: expect.any(String) } });
    expect(parseFormalForm("pengisiAcara", form({ id: ID, peran: "Moderator" }))).toMatchObject({ ok: false, errors: { "nama-0": expect.any(String) } });
  });
  it("membatasi jumlah pengisi acara dan mengosongkan daftar secara eksplisit", () => {
    const data = new FormData();
    for (let i = 0; i < 13; i++) { data.append("id", `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`); data.append("nama", "Pembicara"); }
    expect(parseFormalForm("pengisiAcara", data).ok).toBe(false);
    expect(parseFormalForm("pengisiAcara", new FormData())).toEqual({ ok: true, input: { pengisiAcara: [] } });
  });
  it("membaca konten rusak dengan aman serta tidak menghidupkan bagian lama", () => {
    const content = readContent({ identitas: [], kontak: null, penyelenggara: "nama", pengisiAcara: [null, { id: ID, nama: "A" }, { id: ID, nama: "B" }], amplop: [{}], cerita: [{}], kutipan: "Lama" });
    expect(content.identitas).toEqual({ jenis: "", subjudul: "", deskripsi: "" });
    expect(content.kontak).toEqual({ nama: "", telepon: "", email: "" });
    expect(content.pengisiAcara).toHaveLength(1);
    expect(content.ucapan.tampil).toBe(false);
    for (const key of ["amplop", "cerita", "kutipan"]) expect(content).not.toHaveProperty(key);
  });
});
