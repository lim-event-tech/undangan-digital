"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldErrors, SaveResult } from "@/lib/save-result";

export type SaveStatus = "diam" | "menyimpan" | "tersimpan" | "galat";

const FAILED_MESSAGE = "Perubahan belum tersimpan. Periksa koneksi, lalu coba lagi.";

export function useAutoSave(
  action: (formData: FormData) => Promise<SaveResult>,
  delay = 700,
) {
  const formRef = useRef<HTMLFormElement>(null);
  const pendingForm = useRef<HTMLFormElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sequence = useRef(0);
  const [status, setStatus] = useState<SaveStatus>("diam");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();

  const save = useCallback(
    async (form: HTMLFormElement | null) => {
      if (!form) return;
      const current = ++sequence.current;
      setStatus("menyimpan");
      try {
        const result = await action(new FormData(form));
        if (current !== sequence.current) return;
        if (result.ok) {
          setErrors({});
          setFormError(undefined);
          setStatus("tersimpan");
        } else {
          setErrors(result.errors ?? {});
          setFormError(result.formError);
          setStatus("galat");
        }
      } catch {
        if (current !== sequence.current) return;
        setFormError(FAILED_MESSAGE);
        setStatus("galat");
      }
    },
    [action],
  );

  const schedule = useCallback(() => {
    pendingForm.current = formRef.current;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      void save(pendingForm.current);
    }, delay);
  }, [save, delay]);

  const flush = useCallback(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    void save(pendingForm.current);
  }, [save]);

  useEffect(
    () => () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
      timer.current = undefined;
      void save(pendingForm.current);
    },
    [save],
  );

  return {
    formRef,
    status,
    errors,
    formError,
    formProps: {
      onChange: schedule,
      onBlur: flush,
      onSubmit: (event: React.FormEvent) => event.preventDefault(),
    },
  };
}

export function StatusSimpan({ status }: { status: SaveStatus }) {
  const teks =
    status === "menyimpan"
      ? "Menyimpan…"
      : status === "tersimpan"
        ? "Tersimpan"
        : status === "galat"
          ? "Belum tersimpan"
          : "Tersimpan otomatis";
  const warna =
    status === "galat"
      ? "text-galat"
      : status === "tersimpan"
        ? "text-hijau"
        : "text-redup";
  return (
    <span role="status" aria-live="polite" className={`text-xs font-medium ${warna}`}>
      {teks}
    </span>
  );
}
