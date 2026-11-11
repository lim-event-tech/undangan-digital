import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";
import { syncTemplates } from "../templates/sync";

async function main() {
  await migrate(db, { migrationsFolder: "drizzle" });
  const count = await syncTemplates(db);
  console.log(`Migrasi selesai, ${count} template terdaftar.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
