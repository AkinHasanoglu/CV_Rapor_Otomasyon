import { json, fail } from "@/lib/api";
import { stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook dinleyicisi: abonelik olaylarını (created/updated/deleted)
 * işleyip kullanıcı planını ve rol yetkisini günceller.
 */
export async function POST(request: Request) {
  if (!stripeEnabled) {
    return json({ received: false, note: "Stripe yapılandırılmadı (simülasyon modu)." });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return fail("stripe-signature üst bilgisi eksik.", 400);

  const { verifyWebhook } = await import("@/lib/stripe");
  const { getStore } = await import("@/lib/db");

  try {
    const payload = Buffer.from(await request.arrayBuffer());
    const event = verifyWebhook(payload, signature);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          metadata?: { userId?: string; planId?: string };
          customer?: string;
          subscription?: string;
        };
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        if (userId && planId && (planId === "individual" || planId === "business")) {
          await getStore().updateUser(userId, {
            plan: planId,
            subscriptionStatus: "active",
            stripeCustomerId: session.customer ?? null,
            stripeSubscriptionId: session.subscription ?? null,
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as {
          customer?: string;
          status?: string;
          current_period_end?: number;
        };
        const store = getStore();
        const customerId = sub.customer ? String(sub.customer) : null;
        if (!customerId) break;
        const users = await listAllUsers();
        const user = users.find((u) => u.stripeCustomerId === customerId);
        if (user) {
          const active = sub.status === "active" || sub.status === "trialing";
          await store.updateUser(user.id, {
            subscriptionStatus: active ? "active" : "canceled",
            subscriptionPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          });
        }
        break;
      }
    }

    return json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook]", err);
    return json({ error: "Webhook işlenemedi" }, 400);
  }
}

// Not: Bu yardımcı, dosya deposundaki tüm kullanıcıları tarar (webhook'ta
// müşteri -> kullanıcı eşlemesi için). Postgres'te bu sorgu çok daha verimlidir.
async function listAllUsers(): Promise<{ id: string; stripeCustomerId: string | null }[]> {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
    try {
      const res = await pool.query("SELECT id, stripe_customer_id FROM users WHERE stripe_customer_id IS NOT NULL");
      return res.rows.map((r) => ({ id: r.id, stripeCustomerId: r.stripe_customer_id }));
    } finally {
      await pool.end();
    }
  }
  const { FileStore } = await import("@/lib/db/file-store");
  const fs = new FileStore();
  const users = await fs.listAllUsers();
  return users.map((u) => ({ id: u.id, stripeCustomerId: u.stripeCustomerId }));
}
