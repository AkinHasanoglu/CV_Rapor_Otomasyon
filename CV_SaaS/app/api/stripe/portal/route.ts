import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { createPortalSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;

  try {
    if (!userRes.stripeCustomerId) {
      return fail("Aktif bir abonelik bulunamadı.", 404);
    }
    const url = await createPortalSession(userRes.stripeCustomerId);
    return json({ url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return fail("Müşteri portalı açılamadı.", 500);
  }
}
