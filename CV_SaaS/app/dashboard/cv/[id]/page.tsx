"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/modal";
import { isPlaceholder, type CVCandidate } from "@/lib/cv/types";
import { cn } from "@/lib/utils";

/** Placeholder içeren metni vurgulu render eder */
export function Highlighted({ text }: { text: string }) {
  if (!isPlaceholder(text)) return <>{text}</>;
  return <span className="ph-placeholder">{text}</span>;
}

function FieldEdit({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      {multiline ? (
        <Textarea
          className="min-h-20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

interface CvVersion {
  id: string;
  title: string;
  createdAt: string;
}

export default function CvEditorPage() {
  const params = useParams<{ id: string }>();
  const [cv, setCv] = useState<CVCandidate | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [versions, setVersions] = useState<CvVersion[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadVersions = () => {
    fetch(`/api/cv/${params.id}/versions`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setVersions(d.versions ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch(`/api/cv/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCv(d.cv as CVCandidate);
        setTitle(d.title);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const placeholderCount = useMemo(() => {
    if (!cv) return 0;
    const strs = [
      cv.summary,
      ...cv.experience.flatMap((e) => [e.role, e.company, e.description, ...e.achievements]),
      ...cv.education.flatMap((e) => [e.degree, e.institution]),
      ...cv.projects.flatMap((p) => [p.name, p.description]),
      ...cv.references,
    ];
    return strs.filter(isPlaceholder).length;
  }, [cv]);

  const setField = (key: keyof CVCandidate, value: unknown) => {
    setCv((c) => (c ? { ...c, [key]: value } : c));
    setSaved(false);
  };

  const setExp = (i: number, key: string, value: string) => {
    setCv((c) => {
      if (!c) return c;
      const list = c.experience.map((e, idx) =>
        idx === i ? ({ ...e, [key]: value } as typeof e) : e
      );
      return { ...c, experience: list };
    });
    setSaved(false);
  };

  const setEdu = (i: number, key: string, value: string) => {
    setCv((c) => {
      if (!c) return c;
      const list = c.education.map((e, idx) =>
        idx === i ? ({ ...e, [key]: value } as typeof e) : e
      );
      return { ...c, education: list };
    });
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/cv/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, cv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi.");
      setSaved(true);
      loadVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const restore = async (versionId: string) => {
    if (!confirm("Bu sürüme geri dönülecek. Mevcut durum yeni bir sürüm olarak saklanacak. Devam edilsin mi?")) return;
    setRestoring(versionId);
    setError("");
    try {
      const res = await fetch(`/api/cv/${params.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Geri yükleme başarısız.");
      setCv(data.cv as CVCandidate);
      setTitle(data.title);
      setSaved(true);
      loadVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setRestoring(null);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Yükleniyor...</div>;
  if (error && !cv) return <Alert tone="error">{error}</Alert>;
  if (!cv) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/cv" className="text-sm text-slate-500 hover:text-brand">
            ← Geri
          </Link>
          <h1 className="text-2xl font-black text-slate-900">CV Düzenle</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/api/cv/${params.id}/export?format=pdf`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">PDF İndir</Button>
          </a>
          <a href={`/api/cv/${params.id}/export?format=docx`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">DOCX İndir</Button>
          </a>
          <Button size="sm" onClick={save} loading={saving}>
            {saved ? "Kaydedildi ✓" : "Kaydet"}
          </Button>
        </div>
      </div>

      {placeholderCount > 0 && (
        <Alert tone="warning">
          <strong>{placeholderCount} yer tutucu</strong> — boş bırakılan alanlara AI tarafından
          eklendi. <span className="ph-placeholder">Sarı işaretli</span> alanları kendi
          bilgilerinizle değiştirin; istemezseniz silin.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Düzenleme ─────────────────────────────── */}
        <div className="space-y-4">
          <FieldEdit label="Başlık" value={title} onChange={setTitle} />

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 font-bold text-slate-900">Kişisel Bilgiler</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldEdit label="Ad Soyad" value={cv.fullName} onChange={(v) => setField("fullName", v)} />
              <FieldEdit label="Unvan" value={cv.title} onChange={(v) => setField("title", v)} />
              <FieldEdit label="E-posta" value={cv.email} onChange={(v) => setField("email", v)} />
              <FieldEdit label="Telefon" value={cv.phone} onChange={(v) => setField("phone", v)} />
              <FieldEdit label="Şehir" value={cv.location} onChange={(v) => setField("location", v)} />
              <FieldEdit label="LinkedIn" value={cv.linkedin} onChange={(v) => setField("linkedin", v)} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 font-bold text-slate-900">Profesyonel Özet</h3>
            <FieldEdit label="Özet" value={cv.summary} onChange={(v) => setField("summary", v)} multiline />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 font-bold text-slate-900">İş Deneyimi</h3>
            <div className="space-y-3">
              {cv.experience.map((exp, i) => (
                <div key={i} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                  <FieldEdit label="Pozisyon" value={exp.role} onChange={(v) => setExp(i, "role", v)} />
                  <FieldEdit label="Şirket" value={exp.company} onChange={(v) => setExp(i, "company", v)} />
                  <FieldEdit label="Başlangıç" value={exp.startDate} onChange={(v) => setExp(i, "startDate", v)} />
                  <FieldEdit label="Bitiş" value={exp.endDate} onChange={(v) => setExp(i, "endDate", v)} />
                  <div className="sm:col-span-2">
                    <FieldEdit label="Açıklama" value={exp.description} onChange={(v) => setExp(i, "description", v)} multiline />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 font-bold text-slate-900">Eğitim</h3>
            <div className="space-y-3">
              {cv.education.map((edu, i) => (
                <div key={i} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                  <FieldEdit label="Bölüm" value={edu.degree} onChange={(v) => setEdu(i, "degree", v)} />
                  <FieldEdit label="Kurum" value={edu.institution} onChange={(v) => setEdu(i, "institution", v)} />
                  <FieldEdit label="Başlangıç" value={edu.startDate} onChange={(v) => setEdu(i, "startDate", v)} />
                  <FieldEdit label="Bitiş" value={edu.endDate} onChange={(v) => setEdu(i, "endDate", v)} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 font-bold text-slate-900">Yetenekler</h3>
            <FieldEdit
              label="Yetenekler"
              value={cv.skills.join(", ")}
              onChange={(v) => setField("skills", v.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-1 font-bold text-slate-900">Sürüm Geçmişi</h3>
            <p className="mb-3 text-xs text-slate-500">
              Her kayıtta önceki durum otomatik saklanır (son {20} sürüm).
            </p>
            {versions.length === 0 ? (
              <p className="text-sm text-slate-400">Henüz sürüm yok. Kaydettiğinizde otomatik oluşturulur.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{v.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(v.createdAt).toLocaleString("tr-TR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => restore(v.id)}
                      loading={restoring === v.id}
                    >
                      Geri Yükle
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Canlı Önizleme ────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Canlı Önizleme
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b-4 border-brand px-6 py-5">
              <h2 className="text-2xl font-black text-slate-900">
                <Highlighted text={cv.fullName || "Ad Soyad"} />
              </h2>
              {cv.title && (
                <p className="mt-0.5 font-bold text-brand">
                  <Highlighted text={cv.title} />
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                {[cv.email, cv.phone, cv.location, cv.linkedin, cv.website]
                  .filter(Boolean)
                  .join("  |  ")}
              </p>
            </div>

            <div className="space-y-5 px-6 py-5 text-sm">
              {cv.summary && (
                <section>
                  <h3 className="mb-1 border-b border-slate-200 pb-1 text-xs font-black uppercase tracking-wide text-brand">
                    Profesyonel Özet
                  </h3>
                  <p className="text-slate-700"><Highlighted text={cv.summary} /></p>
                </section>
              )}
              {cv.experience.length > 0 && (
                <section>
                  <h3 className="mb-2 border-b border-slate-200 pb-1 text-xs font-black uppercase tracking-wide text-brand">
                    İş Deneyimi
                  </h3>
                  <div className="space-y-3">
                    {cv.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="flex justify-between">
                          <p className="font-bold text-slate-900"><Highlighted text={exp.role} /></p>
                          {exp.startDate && exp.endDate && (
                            <p className="text-xs text-slate-400">{exp.startDate} – {exp.endDate}</p>
                          )}
                        </div>
                        {(exp.company || exp.location) && (
                          <p className="text-xs font-bold text-brand">
                            <Highlighted text={[exp.company, exp.location].filter(Boolean).join(" · ")} />
                          </p>
                        )}
                        {exp.description && (
                          <p className={cn("mt-1 text-slate-600")}><Highlighted text={exp.description} /></p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {cv.education.length > 0 && (
                <section>
                  <h3 className="mb-2 border-b border-slate-200 pb-1 text-xs font-black uppercase tracking-wide text-brand">
                    Eğitim
                  </h3>
                  <div className="space-y-2">
                    {cv.education.map((edu, i) => (
                      <div key={i} className="flex justify-between">
                        <div>
                          <p className="font-bold text-slate-900"><Highlighted text={edu.degree} /></p>
                          {edu.institution && (
                            <p className="text-xs text-slate-500"><Highlighted text={edu.institution} /></p>
                          )}
                        </div>
                        {edu.startDate && edu.endDate && (
                          <p className="text-xs text-slate-400">{edu.startDate} – {edu.endDate}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {cv.skills.length > 0 && (
                <section>
                  <h3 className="mb-1 border-b border-slate-200 pb-1 text-xs font-black uppercase tracking-wide text-brand">
                    Yetenekler
                  </h3>
                  <p className="text-slate-700">{cv.skills.join("  •  ")}</p>
                </section>
              )}
              {cv.projects.length > 0 && (
                <section>
                  <h3 className="mb-1 border-b border-slate-200 pb-1 text-xs font-black uppercase tracking-wide text-brand">
                    Projeler
                  </h3>
                  {cv.projects.map((p, i) => (
                    <p key={i} className="text-slate-700">
                      <span className="font-bold text-slate-900"><Highlighted text={p.name} /></span>
                      {p.description && <> — <Highlighted text={p.description} /></>}
                    </p>
                  ))}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
