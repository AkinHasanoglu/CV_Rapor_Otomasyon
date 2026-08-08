import { json, getCurrentUser } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ user: null });
  return json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPeriodEnd: user.subscriptionPeriodEnd,
    },
  });
}

export const dynamic = "force-dynamic";
