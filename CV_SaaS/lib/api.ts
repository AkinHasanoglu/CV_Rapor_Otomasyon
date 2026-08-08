import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./auth";
import { getStore } from "./db";
import type { User } from "./db/types";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Mevcut oturumdaki kullanıcıyı getirir; oturum yoksa null döner. */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  const user = await getStore().findUserById(session.userId);
  return user;
}

/** API rotaları için: oturum yoksa 401 döndürür. */
export async function requireUser(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Oturum açmanız gerekiyor.", 401);
  return user;
}

export async function setSessionCookie(token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const secure = appUrl.startsWith("https://");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
