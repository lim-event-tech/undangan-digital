import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { user } from "./schema";
import { syncTemplates } from "../templates/sync";
import { createAdmin } from "../lib/admin/team";

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "Admin utama").trim() || "Admin utama";

  if (!email || !password) {
    return;
  }

  const [existing] = await db
    .select({ id: user.id, role: user.adminRole })
    .from(user)
    .where(eq(user.email, email));

  if (existing) {
    if (existing.role) {
      console.log(`[Seed Admin] Super admin ${email} sudah ada.`);
    } else {
      console.warn(`[Seed Admin] Peringatan: Email ${email} sudah dipakai akun pengguna biasa.`);
    }
    return;
  }

  const result = await createAdmin(db, { name, email, password, role: "super" });
  if (!result.ok) {
    console.error(
      `[Seed Admin] Gagal membuat super admin: ${result.error === "sandi" ? (result.message ?? "Kata sandi tidak valid") : result.error}`,
    );
    return;
  }
  console.log(`[Seed Admin] Super admin ${email} berhasil dibuat.`);
}

async function main() {
  await migrate(db, { migrationsFolder: "drizzle" });
  const count = await syncTemplates(db);
  console.log(`Migrasi selesai, ${count} template terdaftar.`);

  await seedAdmin();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
