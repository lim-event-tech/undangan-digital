import "./load-env";
import { db } from "./index";
import { syncTemplates } from "../templates/sync";

const show = process.argv.includes("--tampilkan");

syncTemplates(db, { show })
  .then((count) => {
    console.log(
      `${count} template terdaftar${show ? " dan ditampilkan" : " (tersembunyi sampai ditampilkan admin)"}.`,
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
