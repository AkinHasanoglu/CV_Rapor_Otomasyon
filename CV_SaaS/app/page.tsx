import Link from "next/link";
import { RoiMetrics } from "@/components/roi-metrics";

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-brand">
              <span className="size-2 animate-pulse rounded-full bg-brand" />
              Yapay zeka destekli CV otomasyonu
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
              CV&apos;nizi saniyeler içinde{" "}
              <span className="bg-gradient-to-r from-brand to-blue-400 bg-clip-text text-transparent">
                profesyonelleştirin
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Mevcut taslağınızı yükleyin ya da formu doldurun — yapay zeka ajanı
              verinizi ayrıştırır, dili profesyonelleştirir ve şık bir CV&apos;ye
              dönüştürür. Kurumsal misiniz? Excel&apos;deki yüzlerce adayı tek
              tıkla işleyin.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-xl bg-brand px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                Ücretsiz CV Oluştur
              </Link>
              <Link
                href="/pricing"
                className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-base font-bold text-slate-800 transition hover:border-brand hover:text-brand"
              >
                Fiyatları Gör
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Kredi kartı gerekmez • PDF & DOCX indirme • Yer tutucu desteği
            </p>
          </div>
        </div>
      </section>

      {/* ── Nasıl Çalışır ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
          İki yöntem, tek sonuç: profesyonel CV
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">
          Sistem iki akışı da sorunsuz yönetir — elinizdeki taslağı geliştirin ya
          da sıfırdan oluşturun.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
            <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              📄
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              A — Taslak yükleyerek
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Mevcut CV&apos;nizi PDF, DOCX veya TXT olarak yükleyin</li>
              <li>• &quot;Ek Notlar / Talepler&quot; kutusuna eklemek istediklerinizi yazın</li>
              <li>• Yapay zeka ajanı veriyi ayrıştırır, notlarla harmanlar, yazım hatalarını düzeltir</li>
              <li>• Veriniz profesyonel bir şablona yerleştirilir</li>
            </ul>
            <Link href="/signup" className="mt-5 inline-block text-sm font-bold text-brand hover:underline">
              Taslağımı yükle →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
              ✍️
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              B — Sıfırdan form ile
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Eğitim, deneyim, projeler ve yetenekler için dinamik formu doldurun</li>
              <li>• İstediğiniz alanı boş bırakabilirsiniz</li>
              <li>• Boş bırakılan zorunlu bölümlere özel yer tutucular eklenir</li>
              <li>• Yer tutucuları düzenleyip PDF & DOCX olarak indirin</li>
            </ul>
            <Link href="/signup" className="mt-5 inline-block text-sm font-bold text-brand hover:underline">
              Formla başla →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ROI Metrikleri (zorunlu alan) ─────────────────── */}
      <RoiMetrics />

      {/* ── B2C / B2B ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-8">
            <h3 className="text-xl font-bold text-slate-900">Bireysel Kullanıcılar</h3>
            <p className="mt-2 text-sm text-slate-600">
              İş başvurularında öne çıkmak isteyen profesyoneller için tasarlandı.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>✓ AI ile dil profesyonelleştirme ve yazım hatası düzeltme</li>
              <li>✓ Profesyonel CV şablonları (PDF + DOCX)</li>
              <li>✓ Boş alanlar için akıllı yer tutucular</li>
              <li>✓ Belge geçmişi ve düzenleme</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8">
            <h3 className="text-xl font-bold text-slate-900">Kurumsal Kullanıcılar</h3>
            <p className="mt-2 text-sm text-slate-600">
              İK ve taşeron firmalar için toplu otomasyon modülü.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>✓ Excel (.xlsx / CSV) ile yüzlerce adayı tek seferde işle</li>
              <li>✓ 3 çıktı formatı: Profesyonel CV, Resume, Taşeron Sunumu</li>
              <li>✓ Sunucusuz arka plan worker&apos;ları ile asenkron işleme</li>
              <li>✓ Tüm çıktılar tek ZIP arşivinde teslim</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand to-blue-600 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            İlk CV&apos;niz tamamen ücretsiz
          </h2>
          <p className="mt-3 text-lg text-blue-100">
            Kayıt olun, taslağınızı yükleyin veya formu doldurun — dakikalar içinde
            profesyonel CV&apos;niz hazır.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-brand shadow-lg transition hover:bg-blue-50"
          >
            Hemen Başla
          </Link>
        </div>
      </section>
    </div>
  );
}
