"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/modal";

export default function PricingPage() {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("canceled")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanceled(true);
    }
  }, []);

  const upgrade = async (planId: "individual" | "business") => {
    setUpgrading(planId);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ödeme oturumu oluşturulamadı.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black text-slate-900">Fiyatlandırma</h1>
        <p className="mt-3 text-lg text-slate-500">
          Bireysel ve kurumsal kullanıcılar için ayrı abonelik katmanları.
          İstediğiniz zaman iptal edin.
        </p>
      </div>

      {canceled && (
        <div className="mx-auto mt-6 max-w-2xl">
          <Alert tone="info">Ödeme işlemi iptal edildi. Hazır olduğunuzda tekrar deneyebilirsiniz.</Alert>
        </div>
      )}
      {error && (
        <div className="mx-auto mt-6 max-w-2xl">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            className={
              plan.id === "individual"
                ? "relative flex flex-col rounded-2xl border-2 border-brand bg-white p-8 shadow-xl"
                : "flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            }
          >
            {plan.id === "individual" && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                En Popüler
              </span>
            )}
            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-black text-slate-900">
                {plan.monthlyPriceUsd === 0 ? "0" : `$${plan.monthlyPriceUsd}`}
              </span>
              <span className="mb-1 text-sm text-slate-400">/ay</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              {plan.id === "free" ? (
                <Link href="/signup" className="block w-full">
                  <Button className="w-full" variant="outline" size="lg">
                    Ücretsiz Başla
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.id === "individual" ? "primary" : "secondary"}
                  loading={upgrading === plan.id}
                  onClick={() => upgrade(plan.id as "individual" | "business")}
                >
                  {plan.id === "business" ? "Kurumsal Plana Geç" : "Bireysel Plana Geç"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-slate-400">
        Ödemeler güvenli şekilde Stripe altyapısıyla işlenir. Kurumsal faturalama
        için{" "}
        <Link href="/contact" className="text-brand hover:underline">
          iletişime geçin
        </Link>
        .
      </p>
    </div>
  );
}
