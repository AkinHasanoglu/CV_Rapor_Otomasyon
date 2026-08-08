import { NextResponse } from "next/server";
import { requireUser, fail } from "@/lib/api";
import { getStore } from "@/lib/db";
import { renderPdf } from "@/lib/cv/generate-pdf";
import { renderDocx } from "@/lib/cv/generate-docx";
import { normalizeCandidate } from "@/lib/cv/types";
import { safeFileName } from "@/lib/cv/parse-draft";
import { contentDisposition } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;
  const { id } = await ctx.params;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "pdf";
  if (!["pdf", "docx"].includes(format)) return fail("Geçersiz format.");

  const doc = await getStore().getDocument(userRes.id, id);
  if (!doc) return fail("Belge bulunamadı.", 404);

  const cv = normalizeCandidate(doc.cvData as Record<string, unknown>);
  const base = safeFileName(doc.title || cv.fullName || "cv");

  if (format === "pdf") {
    const buffer = await renderPdf(cv);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(`${base}.pdf`),
      },
    });
  }

  const buffer = await renderDocx(cv);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": contentDisposition(`${base}.docx`),
    },
  });
}
