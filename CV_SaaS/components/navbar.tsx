"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: "b2c" | "b2b";
  plan: string;
}

const NAV = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/contact", label: "İletişim" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-white">
            CV
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            CV<span className="text-brand">Forge</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Panelim
              </Link>
              <button
                onClick={signOut}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Giriş
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Ücretsiz Başla
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
