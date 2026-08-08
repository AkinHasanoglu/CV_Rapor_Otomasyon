import { getStore } from "@/lib/db";
import type { Job } from "@/lib/db/types";
import { generateCandidateFromRow } from "@/lib/ai";
import { safeFileName } from "@/lib/cv/parse-draft";

export const DEFAULT_BATCH_SIZE = 15;

/**
 * Sunucusuz (serverless) arka plan işlemcisi.
 * Vercel cron (her dakika /api/cron/process-jobs) ve kullanıcı tarafı
 * tetiklenen /api/b2b/jobs/[id]/process rotası tarafından çağrılır.
 * Her çağrı en fazla batchSize satır işler — böylece platform timeout
 * sınırlarına takılmadan kuyruk adım adım tükenir.
 */
export async function processPendingRows(batchSize = DEFAULT_BATCH_SIZE): Promise<{
  processed: number;
  jobsDone: number;
}> {
  const store = getStore();
  const pendingJobs = await store.listPendingJobs(5);
  let processed = 0;
  let jobsDone = 0;

  for (const job of pendingJobs) {
    const batch = await store.listJobRows(job.id, "queued", batchSize);
    if (batch.length === 0) {
      await finalizeJob(job.id);
      jobsDone += 1;
      continue;
    }

    await store.updateJob(job.id, { status: "processing" });

    for (const row of batch) {
      processed += 1;
      await store.updateJobRow(row.id, { status: "processing" });
      try {
        const cv = await generateCandidateFromRow(row.data, job.outputType);
        const name = String(row.data["ad"] ?? row.data["full_name"] ?? row.candidateName ?? "");
        const surname = String(row.data["soyad"] ?? "");
        const display = [name, surname].filter(Boolean).join(" ") || row.candidateName || `aday_${row.rowIndex + 1}`;
        await store.updateJobRow(row.id, {
          status: "completed",
          output: { cv },
          filename: safeFileName(`${display}_${job.outputType}`),
        });
      } catch (err) {
        await store.updateJobRow(row.id, {
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const final = await finalizeJob(job.id);
    if (final === "completed" || final === "partial") jobsDone += 1;
  }

  return { processed, jobsDone };
}

/**
 * İş durumunu kuyruktaki satırların durumuna göre yeniden hesaplar.
 */
async function finalizeJob(jobId: string): Promise<Job["status"]> {
  const store = getStore();
  const completed = await store.countJobRows(jobId, "completed");
  const failed = await store.countJobRows(jobId, "failed");
  const total = completed + failed;
  const job = await store.updateJob(jobId, {
    processedRows: completed + failed,
    failedRows: failed,
  });
  if (!job) return "queued";
  if (total >= job.totalRows) {
    const status: Job["status"] = failed > 0 && completed > 0 ? "partial" : failed > 0 ? "failed" : "completed";
    await store.updateJob(jobId, { status });
    return status;
  }
  return "processing";
}
