import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Simülasyon modu: STRIPE_SECRET_KEY tanımlı olmadığında ödeme akışını
 * canlı demo için tamamlar (gerçek tahsilat yok, plan doğrudan etkinleştirilir).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const planId = url.searchParams.get("plan");
  if (planId !== "individual" && planId !== "business") {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }

  const { verifySession } = await import("@/lib/auth");
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("cv_session")?.value;
  const session = token ? await verifySession(token) : null;

  if (session) {
    await getStore().updateUser(session.userId, {
      plan: planId,
      subscriptionStatus: "active",
      subscriptionPeriodEnd: new Date(Date.now() + 30 * 864e5).toISOString(),
    });
  }

  return NextResponse.redirect(
    new URL(`/dashboard?upgrade=success&simulated=1&plan=${planId}`, request.url)
  );
}
