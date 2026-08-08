import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { getStore } from "@/lib/db";
import { FREE_DOC_LIMIT } from "@/lib/plans";
import { generateCVFromDraft } from "@/lib/ai";
import { extractTextFromDraft } from "@/lib/cv/parse-draft";

export const maxDuration = 120;

/**
 * Senaryo A: Kullanıcı mevcut CV taslağını (PDF/DOCX/TXT) ve ek notları
 * yükler; AI ajanı ayrıştırır, harmanlar, profesyonelleştirir.
 */
export async function POST(request: Request) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const notes = String(formData.get("notes") ?? "");
    const title = String(formData.get("title") ?? "").trim() || "Taslaktan CV";

    if (!(file instanceof File)) {
      return fail("Lütfen bir dosya yükleyin (PDF, DOCX veya TXT).");
    }
    if (!["pdf", "docx", "doc", "txt", "md", "text"].includes(
      file.name.split(".").pop()?.toLowerCase() ?? ""
    )) {
      return fail("Desteklenen formatlar: PDF, DOCX, TXT.");
    }

    const store = getStore();

    // Ücretsiz plan sınırı
    if (userRes.plan === "free") {
      const docs = await store.listDocuments(userRes.id);
      if (docs.length >= FREE_DOC_LIMIT) {
        return fail("Ücretsiz planda tek CV oluşturabilirsiniz. Sınırsız için Bireysel plana yükseltin.", 403);
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const draftText = await extractTextFromDraft(buffer, file.name);
    if (!draftText.trim()) {
      return fail("Dosyadan metin çıkarılamadı. Farklı bir format deneyin.");
    }

    const cvData = await generateCVFromDraft(draftText, notes);

    const doc = await store.createDocument({
      userId: userRes.id,
      title,
      source: "draft",
      inputSummary: { fileName: file.name, notes, draftPreview: draftText.slice(0, 500) },
      cvData: cvData as unknown as Record<string, unknown>,
    });

    return json({ id: doc.id, cv: cvData }, 201);
  } catch (err) {
    console.error("[cv/from-draft]", err);
    return fail("CV üretilirken bir hata oluştu.", 500);
  }
}

export const dynamic = "force-dynamic";
