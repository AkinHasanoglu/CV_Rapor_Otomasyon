import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hakkımızda" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-black text-slate-900">Hakkımızda</h1>
      <p className="mt-6 text-lg leading-relaxed text-slate-600">
        CVForge, bireysel adayların ve insan kaynakları şirketlerinin en zaman
        alan sürecini — özgeçmiş hazırlığını — yapay zeka ile otomatikleştirmek
        için kuruldu.
      </p>
      <p className="mt-4 leading-relaxed text-slate-600">
        Bireysel kullanıcılar için mevcut taslaklarını yükleyip saniyeler içinde
        profesyonel bir CV&apos;ye dönüştürüyoruz; boş bırakılan alanlar için
        yer tutucular ekleyerek kullanıcının her satırın kontrolünü elinde
        tutmasını sağlıyoruz.
      </p>
      <p className="mt-4 leading-relaxed text-slate-600">
        Kurumsal tarafta ise İK ve taşeron firmaların yüzlerce adayını Excel
        üzerinden toplu işliyor, seçilen formata göre (Profesyonel CV, Resume,
        Taşeron Sunumu) dosyalar üretip tek ZIP arşiviyle teslim ediyoruz.
      </p>
      <p className="mt-4 leading-relaxed text-slate-600">
        Tüm arka plan süreçleri — AI entegrasyonları, dosya dönüştürme ve toplu
        işlemler — kendi sunucusuz altyapımız içinde çalışır; verileriniz KVKK
        uyumlu PostgreSQL üzerinde şifreli saklanır.
      </p>
    </div>
  );
}
