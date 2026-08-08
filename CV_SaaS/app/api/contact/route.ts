import { z } from "zod";
import { json, fail } from "@/lib/api";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

/**
 * İletişim formu. Şimdilik konsola kaydeder; production'da bir
 * e-posta servisine (Resend vb.) bağlayabilirsiniz.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return fail("Geçersiz form verisi.", 422);

  console.info("[contact]", parsed.data);
  return json({ ok: true });
}
