import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { createCheckoutSession } from "@/lib/stripe";
import { getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;

  try {
    const body = await request.json();
    const planId = body.planId as "individual" | "business";
    const plan = getPlan(planId);
    if (plan.id === "free") return fail("Ücretsiz plan için ödeme gerekmez.");

    const result = await createCheckoutSession({
      userId: userRes.id,
      email: userRes.email,
      planId,
    });

    return json(result);
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return fail("Ödeme oturumu oluşturulamadı.", 500);
  }
}
