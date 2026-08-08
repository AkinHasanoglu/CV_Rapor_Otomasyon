import { json, clearSessionCookie } from "@/lib/api";

export async function POST() {
  await clearSessionCookie();
  return json({ ok: true });
}

export const dynamic = "force-dynamic";
