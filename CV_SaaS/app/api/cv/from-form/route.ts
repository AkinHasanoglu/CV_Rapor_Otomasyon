import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { getStore } from "@/lib/db";
import { FREE_DOC_LIMIT } from "@/lib/plans";
import { generateCVFromForm } from "@/lib/ai";
import type { CVCandidate } from "@/lib/cv/types";

export const maxDuration = 120;

/**
 * Senaryo B: Dinamik form verisinden sıfırdan CV üretimi.
 * Boş bırakılan zorunlu bölümlere AI yer tutucu (placeholder) enjekte eder.
 */
export async function POST(request: Request) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;

  try {
    const body = (await request.json()) as {
      title?: string;
      cv?: Partial<CVCandidate>;
    };
    const input = body.cv ?? {};

    if (!input.fullName && !input.summary && !input.experience?.length) {
      return fail("En az ad soyad veya özet alanını doldurun.");
    }

    const store = getStore();
    if (userRes.plan === "free") {
      const docs = await store.listDocuments(userRes.id);
      if (docs.length >= FREE_DOC_LIMIT) {
        return fail("Ücretsiz planda tek CV oluşturabilirsiniz. Sınırsız için Bireysel plana yükseltin.", 403);
      }
    }

    const cvData = await generateCVFromForm(input);

    const doc = await store.createDocument({
      userId: userRes.id,
      title: body.title?.trim() || "Formdan CV",
      source: "form",
      inputSummary: input as unknown as Record<string, unknown>,
      cvData: cvData as unknown as Record<string, unknown>,
    });

    return json({ id: doc.id, cv: cvData }, 201);
  } catch (err) {
    console.error("[cv/from-form]", err);
    return fail("CV üretilirken bir hata oluştu.", 500);
  }
}

export const dynamic = "force-dynamic";
