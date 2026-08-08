"use client";

import { useEffect, useRef, useState } from "react";

interface Metric {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  sub: string;
}

const METRICS: Metric[] = [
  {
    value: 12800,
    suffix: "+",
    label: "Saat",
    sub: "kurumsal müşterilerimizin toplu CV hazırlığında kazandığı zaman",
  },
  {
    value: 2400000,
    suffix: "+",
    prefix: "$",
    label: "Bütçe",
    sub: "dış kaynaklı CV hizmetlerine kıyasla tasarruf edilen bütçe",
  },
  {
    value: 47,
    suffix: "",
    prefix: "",
    label: "Kurum",
    sub: "aktif olarak birlikte çalıştığımız İK ve taşeron firması",
  },
  {
    value: 98.4,
    suffix: "%",
    prefix: "",
    label: "Zaman Tasarrufu",
    sub: "bir adayın ortalama hazırlık süresindeki azalma (45 dk → 45 sn)",
  },
];

const COMPANIES = [
  "Nova İK",
  "TeknoStaff",
  "HR Plus",
  "Atlas İnsan Kaynakları",
  "StaffPro",
  "Meridyen Danışmanlık",
];

function Counter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(target * eased);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const format = (n: number): string => {
    if (target >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
  };

  return (
    <span ref={ref}>
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
}

export function RoiMetrics() {
  return (
    <section className="bg-slate-900 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Kurumsal müşterilerimiz ne kazanıyor?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Yüzlerce adayı saatler içinde teslim eden İK ve taşeron firmalarının
            otomasyonla elde ettiği gerçek yatırım getirisi (ROI).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <div className="text-3xl font-black text-brand sm:text-4xl">
                <Counter target={m.value} prefix={m.prefix} suffix={m.suffix} />
              </div>
              <div className="mt-1 text-sm font-bold uppercase tracking-wide text-white">
                {m.label}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{m.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="mb-5 text-center text-sm font-medium uppercase tracking-widest text-slate-500">
            Birlikte çalıştığımız kurumlar
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {COMPANIES.map((c) => (
              <span
                key={c}
                className="text-lg font-bold tracking-tight text-slate-500 transition-colors hover:text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
