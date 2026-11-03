"use client";

import { useId, useState } from "react";
import { kolom, pesanGalat } from "@/components/ui";

type Dasar = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

function Penjelas({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint ? (
        <span id={`${id}-petunjuk`} className="text-xs text-redup">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-galat`} role="alert" className={pesanGalat}>
          {error}
        </span>
      ) : null}
    </>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  const ids = [hint ? `${id}-petunjuk` : null, error ? `${id}-galat` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function BidangAuth({
  type = "text",
  name,
  ...dasar
}: Dasar & { type?: "text" | "email"; name: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {dasar.label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={dasar.value}
        onChange={(event) => dasar.onChange(event.target.value)}
        autoComplete={dasar.autoComplete}
        required={dasar.required}
        disabled={dasar.disabled}
        aria-invalid={dasar.error ? true : undefined}
        aria-describedby={describedBy(id, dasar.hint, dasar.error)}
        className={kolom}
      />
      <Penjelas id={id} hint={dasar.hint} error={dasar.error} />
    </div>
  );
}

export function BidangKataSandi({ name, ...dasar }: Dasar & { name: string }) {
  const id = useId();
  const [tampil, setTampil] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {dasar.label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={tampil ? "text" : "password"}
          value={dasar.value}
          onChange={(event) => dasar.onChange(event.target.value)}
          autoComplete={dasar.autoComplete}
          required={dasar.required}
          disabled={dasar.disabled}
          aria-invalid={dasar.error ? true : undefined}
          aria-describedby={describedBy(id, dasar.hint, dasar.error)}
          className={`${kolom} pr-28`}
        />
        <button
          type="button"
          aria-pressed={tampil}
          onClick={() => setTampil((nilai) => !nilai)}
          className="absolute top-1/2 right-1.5 min-h-9 -translate-y-1/2 rounded-md px-3 text-xs font-medium text-emas hover:bg-kertas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda"
        >
          {tampil ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <Penjelas id={id} hint={dasar.hint} error={dasar.error} />
    </div>
  );
}
