import { z } from "zod";
import { getStore } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signSession } from "@/lib/auth";
import { json, fail, setSessionCookie } from "@/lib/api";

const signupSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
  fullName: z.string().min(2, "Ad soyad girin."),
  role: z.enum(["b2c", "b2b"]).default("b2c"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Geçersiz form verisi.", 422);
    }
    const { email, password, fullName, role } = parsed.data;

    const store = getStore();
    const existing = await store.findUserByEmail(email);
    if (existing) {
      return fail("Bu e-posta ile zaten bir hesap var.", 409);
    }

    const user = await store.createUser({
      email,
      passwordHash: await hashPassword(password),
      fullName,
      role,
    });

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
    }, 201);
  } catch (err) {
    console.error("[auth/signup]", err);
    return fail("Kayıt sırasında bir hata oluştu.", 500);
  }
}

export const dynamic = "force-dynamic";
