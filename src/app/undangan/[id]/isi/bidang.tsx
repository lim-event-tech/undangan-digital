"use client";

import { useId } from "react";
import { kolom, labelKolom, pesanGalat } from "@/components/ui";

type Umum = { label: string; error?: string; hint?: string };

type InputProps = Umum &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "id" | "aria-invalid">;

type AreaProps = Umum &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id" | "aria-invalid">;

function Penjelas({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string;
  error?: string;
}) {
  return (
    <>
      {hint ? (
        <span id={`${id}-petunjuk`} className="text-xs font-normal text-redup">
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

export function BidangTeks({ label, error, hint, ...input }: InputProps) {
  const id = useId();
  return (
    <label className={labelKolom}>
      {label}
      <input
        {...input}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={kolom}
      />
      <Penjelas id={id} hint={hint} error={error} />
    </label>
  );
}

export function Saklar({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className" | "id" | "type" | "role"
>) {
  const id = useId();
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <label htmlFor={id} className="flex min-w-0 flex-col gap-0.5 text-sm font-medium">
        {label}
        {hint ? <span className="text-xs font-normal text-redup">{hint}</span> : null}
      </label>
      <input
        {...input}
        id={id}
        type="checkbox"
        role="switch"
        className="relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-garis-input transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform checked:bg-hijau checked:after:translate-x-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda"
      />
    </div>
  );
}

export function BidangArea({ label, error, hint, ...area }: AreaProps) {
  const id = useId();
  return (
    <label className={labelKolom}>
      {label}
      <textarea
        {...area}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${kolom} min-h-24 py-2.5 leading-relaxed`}
      />
      <Penjelas id={id} hint={hint} error={error} />
    </label>
  );
}
