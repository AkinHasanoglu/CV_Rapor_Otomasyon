import { z } from "zod";
import { getStore } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signSession } from "@/lib/auth";
import { json, fail, setSessionCookie } from "@/lib/api";

const signinSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().min(1, "Şifre girin."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signinSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Geçersiz form verisi.", 422);
    }
    const { email, password } = parsed.data;

    const user = await getStore().findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail("E-posta veya şifre hatalı.", 401);
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });
    await setSessionCookie(token);

    return json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (err) {
    console.error("[auth/signin]", err);
    return fail("Giriş sırasında bir hata oluştu.", 500);
  }
}

export const dynamic = "force-dynamic";
