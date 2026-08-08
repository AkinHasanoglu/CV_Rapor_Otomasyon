import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { getStore } from "@/lib/db";
import { normalizeCandidate } from "@/lib/cv/types";
import { snapshotVersion } from "@/lib/db/versions";

export const dynamic = "force-dynamic";

function listVersions(doc: {
  versions: { id: string; title: string; createdAt: string }[];
}) {
  return (doc.versions ?? []).slice().reverse();
}

/** Sürüm geçmişini listeler (en yeni önce) */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;
  const { id } = await ctx.params;

  const doc = await getStore().getDocument(userRes.id, id);
  if (!doc) return fail("Belge bulunamadı.", 404);

  return json({ versions: listVersions(doc) });
}

/** Eski bir sürüme geri döner (önceki durum anlık görüntüye eklenir) */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;
  const { id } = await ctx.params;

  const body = (await request.json()) as { versionId?: string };
  const doc = await getStore().getDocument(userRes.id, id);
  if (!doc) return fail("Belge bulunamadı.", 404);

  const versions = doc.versions ?? [];
  const target = versions.find((v) => v.id === body.versionId);
  if (!target) return fail("Sürüm bulunamadı.", 404);

  const nextVersions = snapshotVersion(doc);
  const updated = await getStore().updateDocument(id, {
    title: target.title,
    cvData: normalizeCandidate(target.cvData as Partial<import("@/lib/cv/types").CVCandidate>) as unknown as Record<string, unknown>,
    versions: nextVersions,
  });

  return json({
    id: updated?.id,
    title: updated?.title,
    cv: updated?.cvData,
    restoredFrom: target.id,
    versions: listVersions(updated ?? doc),
  });
}
