import type { AppDb } from "@/db/types";
import type { WaConfig } from "./config";
import {
  claimNextJob,
  finishJob,
  hasWaitingJobs,
  invitationsAtLimit,
  isAlreadyHandled,
  type JobResult,
} from "./queue";

export type SendOutcome = { ok: true } | { ok: false; error: string };

export type WaSender = {
  ready(): boolean;
  send(phone: string, text: string): Promise<SendOutcome>;
};

export type TickResult = "kosong" | "ditunda" | "dilewati" | "terkirim" | "gagal";

export async function processNext(
  db: AppDb,
  sender: WaSender,
  config: WaConfig,
  now: Date = new Date(),
): Promise<TickResult> {
  if (!config.aktif || !sender.ready()) return "ditunda";

  const limited = await invitationsAtLimit(db, config.batasHarian, now);
  const job = await claimNextJob(db, limited);
  if (!job) {
    return limited.length > 0 && (await hasWaitingJobs(db)) ? "ditunda" : "kosong";
  }

  if (await isAlreadyHandled(db, job)) {
    await finishJob(db, job, { skipped: "Tamu sudah ditandai terkirim" });
    return "dilewati";
  }

  let outcome: SendOutcome;
  try {
    outcome = await sender.send(job.phone, job.message);
  } catch (error) {
    outcome = { ok: false, error: error instanceof Error ? error.message : "Gagal dikirim" };
  }
  const result: JobResult = outcome;
  await finishJob(db, job, result);
  return outcome.ok ? "terkirim" : "gagal";
}
