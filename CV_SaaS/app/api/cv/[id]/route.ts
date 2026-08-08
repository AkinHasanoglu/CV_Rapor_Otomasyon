import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { getStore } from "@/lib/db";
import { normalizeCandidate } from "@/lib/cv/types";
import { snapshotVersion } from "@/lib/db/versions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;
  const { id } = await ctx.params;

  const doc = await getStore().getDocument(userRes.id, id);
  if (!doc) return fail("Belge bulunamadı.", 404);

  return json({ id: doc.id, title: doc.title, source: doc.source, cv: doc.cvData });
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;
  const { id } = await ctx.params;

  const body = await request.json();
  const doc = await getStore().getDocument(userRes.id, id);
  if (!doc) return fail("Belge bulunamadı.", 404);

  const mergedCv = body.cv
    ? normalizeCandidate(body.cv as Partial<import("@/lib/cv/types").CVCandidate>)
    : doc.cvData;
  const versions = snapshotVersion(doc);
  const updated = await getStore().updateDocument(id, {
    title: typeof body.title === "string" ? body.title : doc.title,
    cvData: mergedCv as unknown as Record<string, unknown>,
    versions,
  });

  return json({ id: updated?.id, title: updated?.title, cv: updated?.cvData });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;
  const { id } = await ctx.params;

  await getStore().deleteDocument(userRes.id, id);
  return json({ ok: true });
}
