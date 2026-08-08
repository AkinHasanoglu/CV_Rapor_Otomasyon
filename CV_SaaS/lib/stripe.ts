import Stripe from "stripe";
import { getPlan } from "./plans";

/**
 * Stripe entegrasyonu. STRIPE_SECRET_KEY tanımlı değilse uygulama
 * "simülasyon" modunda çalışır: abonelik işlemleri uygulama içinde
 * işaretlenir (demo akışı) ve gerçek tahsilat yapılmaz.
 */
const apiKey = process.env.STRIPE_SECRET_KEY;
export const stripeEnabled = Boolean(apiKey);

export const stripe = stripeEnabled ? new Stripe(apiKey as string) : null;

export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  planId: "individual" | "business";
}): Promise<{ url: string; mode: "live" | "simulation" }> {
  const plan = getPlan(params.planId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!stripe || !plan.priceId) {
    // Simülasyon modu: ödeme adımı atlanır, kullanıcı doğrudan onay sayfasına yönlendirilir
    return {
      url: `${appUrl}/api/stripe/simulate?plan=${params.planId}`,
      mode: "simulation",
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.email,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    metadata: { userId: params.userId, planId: params.planId },
    success_url: `${appUrl}/dashboard?upgrade=success`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    allow_promotion_codes: true,
  });
  return { url: session.url ?? appUrl, mode: "live" };
}

export async function createPortalSession(customerId: string): Promise<string> {
  if (!stripe) throw new Error("Stripe yapılandırılmadı.");
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
  });
  return session.url;
}

export function verifyWebhook(payload: Buffer, signature: string): Stripe.Event {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Webhook yapılandırılmadı.");
  }
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
