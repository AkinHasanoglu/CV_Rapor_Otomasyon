import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { getStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;
  const { id } = await ctx.params;

  const store = getStore();
  const job = await store.getJob(userRes.id, id);
  if (!job) return fail("İş bulunamadı.", 404);

  const rows = await store.listJobRows(id);
  return json({
    job: {
      ...job,
      progress:
        job.totalRows > 0 ? Math.round(((job.processedRows) / job.totalRows) * 100) : 0,
    },
    rows: rows.map((r) => ({
      id: r.id,
      rowIndex: r.rowIndex,
      candidateName: r.candidateName,
      status: r.status,
      error: r.error,
      filename: r.filename,
    })),
  });
}
