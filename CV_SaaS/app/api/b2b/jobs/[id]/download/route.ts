import { NextResponse } from "next/server";
import { requireUser, fail } from "@/lib/api";
import { getStore } from "@/lib/db";
import { buildZip } from "@/lib/b2b/zip";
import { safeFileName } from "@/lib/cv/parse-draft";
import { contentDisposition } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** B2B: tamamlanan tüm çıktıları ZIP olarak teslim eder */
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

  const rows = await store.listJobRows(id, "completed");
  if (rows.length === 0) {
    return fail("Tamamlanmış dosya bulunmuyor. İşin bitmesini bekleyin.", 409);
  }

  try {
    const zip = await buildZip(rows);
    const name = safeFileName(job.title);
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition(`${name}.zip`),
      },
    });
  } catch (err) {
    console.error("[b2b/download]", err);
    return fail("ZIP oluşturulamadı.", 500);
  }
}
