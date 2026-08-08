"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface JobDetail {
  id: string;
  title: string;
  outputType: string;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  status: string;
  progress: number;
  error: string | null;
}

interface JobRowSummary {
  id: string;
  rowIndex: number;
  candidateName: string;
  status: string;
  error: string | null;
  filename: string | null;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  queued: { label: "Sırada", cls: "bg-amber-50 text-amber-700" },
  processing: { label: "İşleniyor", cls: "bg-blue-50 text-blue-700 animate-pulse" },
  completed: { label: "Tamamlandı", cls: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Hata", cls: "bg-red-50 text-red-700" },
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [rows, setRows] = useState<JobRowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/b2b/jobs/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yüklenemedi.");
      setJob(data.job);
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!job) return;
    const done = job.status === "completed" || job.status === "failed";
    if (done) return;
    const timer = setInterval(async () => {
      const active = job.status === "queued" || job.status === "processing";
      if (active) {
        fetch(`/api/b2b/jobs/${params.id}/process`, { method: "POST" }).catch(() => {});
      }
      await load();
    }, 3500);
    return () => clearInterval(timer);
  }, [job, params.id, load]);

  const downloadZip = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/b2b/jobs/${params.id}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "İndirme başarısız.");
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${job?.title ?? "cv_paket"}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Yükleniyor...</div>;
  if (error && !job) return <Alert tone="error">{error}</Alert>;
  if (!job) return null;

  const done = job.status === "completed" || job.status === "partial";
  const completedCount = rows.filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/b2b" className="text-sm text-slate-500 hover:text-brand">
            ← Toplu İşlemler
          </Link>
          <h1 className="mt-1 text-2xl font-black text-slate-900">{job.title}</h1>
          <p className="text-xs text-slate-500">
            {job.totalRows} aday · Çıktı tipi:{" "}
            <span className="font-bold">
              {job.outputType === "professional"
                ? "Profesyonel CV"
                : job.outputType === "resume"
                  ? "Resume"
                  : "Proje Sunumu"}
            </span>
          </p>
        </div>
        {done && (
          <Button onClick={downloadZip} loading={downloading}>
            ⬇ Tümünü ZIP Olarak İndir ({completedCount} dosya)
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-900">
            İlerleme: {job.processedRows}/{job.totalRows}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              job.status === "completed" && "bg-emerald-50 text-emerald-700",
              job.status === "partial" && "bg-orange-50 text-orange-700",
              job.status === "failed" && "bg-red-50 text-red-700",
              (job.status === "processing" || job.status === "queued") && "bg-blue-50 text-blue-700"
            )}
          >
            {job.status === "completed"
              ? "Tamamlandı"
              : job.status === "partial"
                ? "Kısmen Tamamlandı"
                : job.status === "failed"
                  ? "Başarısız"
                  : job.status === "processing"
                    ? "İşleniyor..."
                    : "Sırada"}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${Math.max(job.progress, 2)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Arka plan worker&apos;ları (Vercel cron + sunucusuz) bu işi asenkron işler —
          sayfayı kapatmanız durumunda işlem devam eder.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Adaylar ({rows.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Aday</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Dosya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const meta = STATUS_META[r.status] ?? STATUS_META.queued;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-slate-400">{r.rowIndex + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.candidateName}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", meta.cls)}>
                        {meta.label}
                      </span>
                      {r.error && <p className="mt-1 text-xs text-red-500">{r.error}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.filename ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
