"use client";

import { tombolTerang } from "@/components/ui";
import { lewatiUndanganAction } from "./actions";

export function TombolLewati() {
  return (
    <form action={lewatiUndanganAction}>
      <button type="submit" className={tombolTerang}>Lanjut ke undangan saya</button>
    </form>
  );
}
