import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-black text-white">
              CV
            </span>
            <span className="font-bold text-slate-900">
              CV<span className="text-brand">Forge</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Yapay zeka destekli profesyonel CV, özgeçmiş ve aday sunumu üretimi.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Ürün</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link className="hover:text-brand" href="/pricing">Fiyatlandırma</Link></li>
            <li><Link className="hover:text-brand" href="/dashboard">Bireysel Panel</Link></li>
            <li><Link className="hover:text-brand" href="/dashboard/b2b">Kurumsal Panel</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Şirket</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link className="hover:text-brand" href="/about">Hakkımızda</Link></li>
            <li><Link className="hover:text-brand" href="/contact">İletişim</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Güvenlik</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>KVKK uyumlu veri işleme</li>
            <li>Şifreli depolama (bcrypt)</li>
            <li>Serverless PostgreSQL altyapısı</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} CVForge. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
