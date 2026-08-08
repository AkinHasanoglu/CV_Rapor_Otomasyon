import type { User } from "./db/types";

export interface PlanDef {
  id: "free" | "individual" | "business";
  name: string;
  tagline: string;
  monthlyPriceUsd: number;
  features: string[];
  priceId?: string;
}

export const PLANS: Record<string, PlanDef> = {
  free: {
    id: "free",
    name: "Ücretsiz",
    tagline: "Bireysel kullanıcılar için başlangıç",
    monthlyPriceUsd: 0,
    features: [
      "1 adet profesyonel CV",
      "Taslak yükleme (PDF/DOCX/TXT)",
      "Form ile CV oluşturma",
      "PDF ve DOCX indirme",
      "Yer tutucu (placeholder) desteği",
    ],
  },
  individual: {
    id: "individual",
    name: "Bireysel",
    tagline: "Aktif iş arayanlar için",
    monthlyPriceUsd: 9,
    features: [
      "Sınırsız CV oluşturma",
      "AI profesyonelleştirme",
      "Tüm şablonlar ve öncelikli çıktı",
      "CV düzenleme ve sürüm geçmişi",
      "PDF, DOCX indirme",
    ],
    priceId: process.env.STRIPE_PRICE_INDIVIDUAL,
  },
  business: {
    id: "business",
    name: "Kurumsal",
    tagline: "İK ve taşeron firmalar için",
    monthlyPriceUsd: 99,
    features: [
      "Sınırsız B2C CV",
      "Excel toplu işleme (1.000+ aday)",
      "3 çıktı formatı: Profesyonel CV, Resume, Taşeron Sunumu",
      "Arka plan işlemci (sunucusuz worker)",
      "ZIP olarak toplu teslim",
      "Öncelikli destek",
    ],
    priceId: process.env.STRIPE_PRICE_BUSINESS,
  },
};

export function getPlan(id: string): PlanDef {
  return PLANS[id] ?? PLANS.free;
}

/** Ücretsiz planda bireysel kullanıcı kaç belge oluşturabilir */
export const FREE_DOC_LIMIT = 1;

export function canUseFeature(user: User, feature: "b2b" | "unlimited-cvs"): boolean {
  if (feature === "b2b") return user.role === "b2b";
  if (feature === "unlimited-cvs") return user.plan !== "free";
  return false;
}

export function isSubscriptionActive(user: User): boolean {
  return (
    user.plan === "free" ||
    user.subscriptionStatus === "active" ||
    user.subscriptionStatus === "trialing"
  );
}
