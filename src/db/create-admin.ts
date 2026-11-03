import "./load-env";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { user } from "./schema";
import { createAdmin, resetAdminPassword } from "../lib/admin/team";

const reset = process.argv.includes("--reset");
const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = (process.env.ADMIN_NAME ?? "Admin utama").trim() || "Admin utama";

async function main(): Promise<number> {
  if (!email || !password) {
    console.error("Isi ADMIN_EMAIL dan ADMIN_PASSWORD di .env terlebih dahulu.");
    return 1;
  }

  const [existing] = await db
    .select({ id: user.id, role: user.adminRole })
    .from(user)
    .where(eq(user.email, email));

  if (existing) {
    if (!existing.role) {
      console.error("Email ini sudah dipakai akun pasangan. Pakai email lain untuk admin.");
      return 1;
    }
    if (!reset) {
      console.error("Admin dengan email ini sudah ada. Tambahkan --reset untuk mengganti kata sandinya.");
      return 1;
    }
    const result = await resetAdminPassword(db, existing.id, password);
    if (!result.ok) {
      console.error(result.error === "sandi" ? (result.message ?? "Kata sandi tidak valid.") : "Admin tidak punya kata sandi.");
      return 1;
    }
    console.log("Kata sandi admin diganti dan semua sesinya dikeluarkan.");
    return 0;
  }

  const result = await createAdmin(db, { name, email, password, role: "super" });
  if (!result.ok) {
    console.error(result.error === "sandi" ? (result.message ?? "Kata sandi tidak valid.") : `Gagal membuat admin: ${result.error}`);
    return 1;
  }
  console.log(`Super admin ${email} dibuat. Masuk lewat /admin/masuk.`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
