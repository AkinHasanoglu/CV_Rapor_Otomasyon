import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { getStore } from "@/lib/db";
import { processPendingRows } from "@/lib/b2b/job-processor";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Kullanıcı tarafından tetiklenebilen adım adım worker çağrısı.
 * İstemci, iş ilerlemesini hızlandırmak için bunu periyodik olarak çağırır;
 * Vercel cron (/api/cron/process-jobs) de aynı işlemciyi kullanır.
 */
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;
  const { id } = await ctx.params;

  const store = getStore();
  const job = await store.getJob(userRes.id, id);
  if (!job) return fail("İş bulunamadı.", 404);
  if (job.status === "completed" || job.status === "failed") {
    return json({ job, notice: "İş zaten tamamlandı." });
  }

  const result = await processPendingRows();
  const fresh = await store.getJob(userRes.id, id);
  return json({ job: fresh, worker: result });
}
