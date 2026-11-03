import type { Metadata } from "next";
import { Halaman, JudulAdmin, Notifikasi } from "@/components/admin-ui";
import { kartu, kolom, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { can } from "@/lib/admin/roles";
import { RIBBONS, TEMPLATE_LABEL_MAX, listTemplateCatalog } from "@/lib/platform/templates";
import { TEMPLATES } from "@/templates/registry";
import { geserTemplateAction, simpanTemplateAction } from "./actions";

export const metadata: Metadata = { title: "Template" };

export default async function TemplateAdminPage() {
  const admin = await requireAdmin();
  const katalog = await listTemplateCatalog(db);
  const bolehAtur = can(admin, "template");
  const belumTerdaftar = TEMPLATES.filter((t) => !katalog.some((item) => item.key === t.key));

  return (
    <Halaman>
      <JudulAdmin
        bagian="Platform"
        judul="Template"
        keterangan="Atur template mana yang tampil di katalog pasangan, urutannya, dan labelnya. Desain dan isi template selalu dibuat lewat kode."
      />

      <Notifikasi jenis="info">
        Template baru masuk lewat kode dan didaftarkan dengan perintah <code>npm run db:templates</code> saat
        deploy, dalam keadaan tersembunyi. Mengubah desain atau menghapus template dilakukan di kode.
      </Notifikasi>

      {belumTerdaftar.length > 0 ? (
        <Notifikasi jenis="galat">
          Ada template di kode yang belum didaftarkan: {belumTerdaftar.map((t) => t.label).join(", ")}. Jalankan{" "}
          <code>npm run db:templates</code>.
        </Notifikasi>
      ) : null}

      {katalog.length === 0 ? (
        <div className={`${kartu} border-dashed p-10 text-center text-sm text-redup-2`}>
          Belum ada template terdaftar.
        </div>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {katalog.map((item, index) => (
            <li key={item.key} className={`${kartu} flex flex-col gap-4 p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-judul text-2xl font-medium">
                    {index + 1}. {item.label}
                  </span>
                  <span className="text-xs text-redup">
                    templates/{item.key} · {item.used} undangan memakai · {item.published} terbit
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.visible ? "bg-hijau-bg text-hijau" : "bg-krem-2 text-redup-2"
                  }`}
                >
                  {item.visible ? "Tampil di katalog" : "Tersembunyi"}
                </span>
              </div>

              {bolehAtur ? (
                <div className="flex flex-wrap items-end gap-3">
                  <form action={simpanTemplateAction} className="flex flex-[1_1_420px] flex-wrap items-end gap-3">
                    <input type="hidden" name="kunci" value={item.key} />
                    <label className="flex min-w-40 flex-[1_1_160px] flex-col gap-1.5 text-[13px] font-medium">
                      Label
                      <input name="label" defaultValue={item.label} maxLength={TEMPLATE_LABEL_MAX} required className={kolom} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                      Pita
                      <select name="pita" defaultValue={item.ribbon ?? ""} className={kolom}>
                        <option value="">Tanpa pita</option>
                        {RIBBONS.map((ribbon) => (
                          <option key={ribbon} value={ribbon}>
                            {ribbon}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
                      <input type="checkbox" name="tampil" defaultChecked={item.visible} className="size-5 accent-emas" />
                      Tampil di katalog
                    </label>
                    <button type="submit" className={tombolTerang}>
                      Simpan
                    </button>
                  </form>
                  <div className="flex gap-2" role="group" aria-label={`Urutan ${item.label}`}>
                    {(["naik", "turun"] as const).map((arah) => (
                      <form key={arah} action={geserTemplateAction}>
                        <input type="hidden" name="kunci" value={item.key} />
                        <input type="hidden" name="arah" value={arah} />
                        <button
                          type="submit"
                          disabled={arah === "naik" ? index === 0 : index === katalog.length - 1}
                          aria-label={`Geser ${item.label} ${arah === "naik" ? "ke atas" : "ke bawah"}`}
                          className={tombolTerang}
                        >
                          {arah === "naik" ? "Naik" : "Turun"}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="m-0 text-sm text-redup">
                  Label {item.ribbon ?? "tanpa pita"} · hanya Super admin yang bisa mengubah katalog.
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      <p className="m-0 max-w-2xl text-xs leading-relaxed text-redup">
        Template tersembunyi tidak muncul untuk pasangan baru. Undangan yang sudah memakainya tetap tampil
        normal. Pita Baru, Populer, dan Unggulan tampil sebagai pita kecil di halaman pilih template.
      </p>
    </Halaman>
  );
}
