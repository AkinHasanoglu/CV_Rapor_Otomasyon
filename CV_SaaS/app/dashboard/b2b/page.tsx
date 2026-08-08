"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Modal, Alert } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface JobSummary {
  id: string;
  title: string;
  outputType: string;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  status: string;
  createdAt: string;
}

const OUTPUT_TYPES = [
  {
    id: "professional",
    icon: "📋",
    title: "Profesyonel CV",
    desc: "Tüm adaylar için detaylı ve standart CV'ler",
  },
  {
    id: "resume",
    icon: "⚡",
    title: "Resume (Özet)",
    desc: "Kısa, hap bilgi içeren özet özgeçmişler",
  },
  {
    id: "project",
    icon: "🏗️",
    title: "Proje Sunum Dosyası",
    desc: "Taşeron sunumu: iletişim bilgileri gizli, yalnızca projeye uygun yetkinlikler",
  },
] as const;

const GUIDE_COLUMNS = [
  { col: "Ad", required: true },
  { col: "Soyad", required: true },
  { col: "Unvan", required: true },
  { col: "Yetenekler", required: true },
  { col: "E-posta", required: false },
  { col: "Telefon", required: false },
  { col: "Şehir", required: false },
  { col: "Özet", required: false },
  { col: "Deneyim", required: false },
  { col: "Eğitim", required: false },
  { col: "Projeler", required: false },
  { col: "Sertifikalar", required: false },
  { col: "Diller", required: false },
];

export default function B2bPage() {
  const router = useRouter();
  const [showGuide, setShowGuide] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [outputType, setOutputType] = useState<string>("professional");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/b2b/jobs");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {
      // sessiz
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "queued" || j.status === "processing");
    if (!hasActive) return;
    const timer = setInterval(() => {
      // İlerlemeyi hızlandırmak için worker'ı tetikle
      const active = jobs.find((j) => j.status === "queued" || j.status === "processing");
      if (active) {
        fetch(`/api/b2b/jobs/${active.id}/process`, { method: "POST" }).catch(() => {});
      }
      loadJobs();
    }, 4000);
    return () => clearInterval(timer);
  }, [jobs, loadJobs]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Lütfen bir Excel dosyası seçin.");
      return;
    }
    setUploading(true);
    setError("");
    setWarnings([]);
    const form = new FormData();
    form.append("file", file);
    form.append("outputType", outputType);
    form.append("title", title);
    try {
      const res = await fetch("/api/b2b/jobs", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yükleme başarısız.");
      if (data.warnings?.length) setWarnings(data.warnings);
      setFile(null);
      setTitle("");
      await loadJobs();
      router.push(`/dashboard/b2b/jobs/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const activeCount = jobs.filter((j) => j.status === "queued" || j.status === "processing").length;

  return (
    <div className="space-y-6">
      <Modal open={showGuide} onClose={() => setShowGuide(false)} title="Yükleme Kılavuzu & Örnek Şablon" wide>
        <div className="space-y-4">
          <Alert tone="info">
            Toplu işleme için <strong>.xlsx</strong>, <strong>.xls</strong> veya Google
            Sheets&apos;ten dışa aktarılmış <strong>.csv</strong> dosyası yükleyebilirsiniz.
          </Alert>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-900">
              Dosyada bulunması gereken sütun başlıkları:
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Sütun</th>
                    <th className="px-3 py-2">Zorunlu</th>
                    <th className="px-3 py-2">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {GUIDE_COLUMNS.map((c) => (
                    <tr key={c.col}>
                      <td className="px-3 py-2 font-mono font-bold text-slate-800">{c.col}</td>
                      <td className="px-3 py-2">
                        {c.required ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">Zorunlu</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Opsiyonel</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {c.col === "Ad" || c.col === "Soyad" || c.col === "Unvan"
                          ? "Her satır bir adaydır. İngilizce başlıklar da tanınır (First Name, Title vb.)."
                          : "Virgülle ayrılmış liste biçiminde yazılabilir."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/api/b2b/sample" download>
              <Button variant="secondary" size="sm">⬇ Örnek Şablonu İndir</Button>
            </a>
            <Button variant="outline" size="sm" onClick={() => setShowGuide(false)}>
              Anladım, yüklemeye geç
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Toplu İşlemler (B2B)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Excel&apos;deki adayları arka plan worker&apos;larıyla asenkron işleyin.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
          📖 Kılavuzu Göster
        </Button>
      </div>

      {activeCount > 0 && (
        <Alert tone="info">
          <strong>{activeCount} iş</strong> arka planda işleniyor. Bu sayfa açıkken ilerleme
          otomatik güncellenir; kapatırsanız Vercel cron her dakika işlemeye devam eder.
        </Alert>
      )}

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <Field label="Excel Dosyası" hint=".xlsx, .xls, .csv">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-brand">
            <span className="text-3xl">📊</span>
            {file ? (
              <span className="mt-2 text-sm font-bold text-slate-900">{file.name}</span>
            ) : (
              <>
                <span className="mt-2 text-sm font-bold text-slate-700">Dosya seçin</span>
                <span className="text-xs text-slate-400">sütun başlıkları yukarıdaki kılavuza uygun olmalı</span>
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>

        <Field label="İş Başlığı" hint="opsiyonel">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Aralık 2026 Aday Paketi" />
        </Field>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Çıktı Tipi</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {OUTPUT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setOutputType(t.id)}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition",
                  outputType === t.id
                    ? "border-brand bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <span className="text-2xl">{t.icon}</span>
                <p className="mt-2 text-sm font-bold text-slate-900">{t.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {warnings.map((w, i) => (
          <Alert key={i} tone="warning">{w}</Alert>
        ))}

        <Button type="submit" loading={uploading} size="lg" className="w-full">
          {uploading ? "Dosya analiz ediliyor..." : "Toplu İşi Başlat"}
        </Button>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">İş Geçmişi</h2>
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
            Henüz toplu iş yok. İlk işinizi yükleyerek başlayın.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <Link
                key={j.id}
                href={`/dashboard/b2b/jobs/${j.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">{j.title}</p>
                  <p className="text-xs text-slate-500">
                    {j.totalRows} aday · {formatDateTime(j.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      j.status === "completed" && "bg-emerald-50 text-emerald-700",
                      j.status === "processing" && "bg-blue-50 text-blue-700",
                      j.status === "queued" && "bg-amber-50 text-amber-700",
                      j.status === "partial" && "bg-orange-50 text-orange-700",
                      j.status === "failed" && "bg-red-50 text-red-700"
                    )}
                  >
                    {j.status}
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {j.processedRows}/{j.totalRows}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
