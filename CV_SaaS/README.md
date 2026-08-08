# CV & Resume Generator SaaS

Yapay zeka destekli, bireysel (B2C) ve kurumsal (B2B) kullanıcılara yönelik CV, özgeçmiş ve aday sunum dosyası oluşturma platformu. Next.js fullstack mimarisiyle Vercel / Netlify üzerinde sunucusuz (serverless) çalışacak şekilde tasarlanmıştır.

## Özellikler

**Bireysel (B2C)**
- Taslak yükleme: PDF / DOCX / TXT dosyanızı yükleyin, AI ayrıştırıp profesyonelleştirsin.
- Form ile sıfırdan oluşturma: Dinamik form; boş bırakılan zorunlu alanlara otomatik **yer tutucu (placeholder)** enjeksiyonu.
- PDF ve DOCX indirme.
- Canlı önizlemeli editör + **sürüm geçmişi** (her kayıtta anlık görüntü, geri yükleme).

**Kurumsal (B2B)**
- Excel (`.xlsx`) / CSV toplu yükleme; örnek şablon indirme kılavuzu.
- 3 çıktı formatı: **Profesyonel CV**, **Resume**, **Taşeron Sunumu** (iletişim bilgileri gizlenir).
- Sunucusuz background worker (Vercel cron) ile satır satır AI işleme, ZIP olarak teslim.

**SaaS çekirdeği**
- Landing page (animasyonlu ROI metriği), Pricing, About, Contact.
- E-posta/şifre ile auth (bcrypt + JWT, role bazlı yönlendirme).
- Stripe abonelikleri (Bireysel $9, Kurumsal $99) + geliştirme için **simülasyon modu**.

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Çatı | Next.js 16 (App Router, `proxy.ts` middleware) |
| Stil | Tailwind CSS 4 |
| Veritabanı | PostgreSQL (Neon / Supabase / Vercel Postgres) — yoksa yerel JSON file-store fallback |
| Yapay Zeka | OpenAI / Anthropic (opsiyonel; yoksa offline şablon motoru) |
| Belge | PDF: PDFKit, DOCX: `docx`, Excel: `xlsx`, PDF ayrıştırma: `pdf-parse`, DOCX ayrıştırma: `mammoth` |
| Ödeme | Stripe (Checkout + Webhook) |
| Arka Plan | Vercel Cron → `/api/cron/process-jobs` |

## Kurulum

```bash
npm install
cp .env.example .env   # gerekli değişkenleri doldurun (aşağıya bakın)
npm run dev            # http://localhost:3000
```

### Ortam Değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | Geliştirmede hayır | PostgreSQL bağlantı dizesi. **Tanımlı değilse** uygulama `.data/` dizininde JSON file-store kullanır (yalnızca geliştirme). |
| `AUTH_SECRET` | Evet | JWT imzalama anahtarı (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | Evet | Uygulama adresi (production'da custom domain) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Hayır | İkisi de yoksa offline şablon motoru devreye girer |
| `STRIPE_SECRET_KEY` | Hayır | Yoksa ödeme akışı simülasyon modunda çalışır (`/api/stripe/simulate`) |
| `STRIPE_WEBHOOK_SECRET` | Hayır | Webhook imza doğrulaması için |
| `CRON_SECRET` | Hayır | Cron isteklerinde opsiyonel doğrulama |

## Mimari

```
app/
  api/
    auth/            # signup, signin, signout, me
    cv/              # from-draft, from-form, [id] (GET/PUT/DELETE), [id]/export, [id]/versions
    b2b/             # jobs, jobs/[id], jobs/[id]/process, jobs/[id]/download, sample
    cron/            # process-jobs — Vercel cron ile çağrılır
    stripe/          # checkout, portal, webhook, simulate
    contact/
  dashboard/         # B2C (cv listesi/editör) ve B2B (iş listesi/iş detayı) arayüzleri
  proxy.ts           # oturum + role bazlı rota koruması (Next.js 16 middleware)
lib/
  db/                # Store arayüzü: FileStore (JSON) ve PostgresStore — birebir aynı API
  cv/                # şablonlar, PDF/DOCX üretimi, taslak ayrıştırma, prompt'lar
  b2b/               # excel ayrıştırma, job processor, zip
  ai/                # OpenAI/Anthropic sağlayıcıları + offline fallback
```

### Veri Deposu

`lib/db/index.ts` içindeki `getStore()`; `DATABASE_URL` tanımlıysa `PostgresStore`, değilse `FileStore` döndürür. Şema `db/schema.sql` dosyasındadır; yeni kurulumlarda (veya mevcut tablolara yeni sütun eklerken) idempotent ifadeler içerir.

### B2B İş Akışı

1. Kullanıcı Excel yükler → iş (`job`) + satırlar (`job_rows`) oluşturulur.
2. `vercel.json`'daki cron (`* * * * *`) `/api/cron/process-jobs` rotasını çağırır; beklemedeki işleri kuyruktan alır, satır satır AI ile üretir.
3. Tamamlanınca `/api/b2b/jobs/[id]/download` tüm dosyaları ZIP olarak döndürür.

Geliştirmede işler senkron da işlenebilir (`POST /api/b2b/jobs` dosya küçükse inline çalıştırır).

### Ödeme

- `STRIPE_SECRET_KEY` yoksa `/pricing` sayfasındaki abonelik butonları `/api/stripe/simulate?plan=individual|business` üzerinden planı doğrudan etkinleştirir (demo).
- Gerçek entegrasyonda: Checkout Session → webhook ile abonelik durumu güncellenir → `/dashboard`'da yetki belirlenir.

## Deploy

### Vercel (önerilen)

1. Repoyu Vercel'e bağlayın; Root Directory olarak `CV_SaaS` seçin (monorepo düzeni).
2. Env değişkenlerini (özellikle `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`) ekleyin.
3. Cron tanımı `vercel.json` içinde hazırdır; proje ayarlarından "Cron Jobs" etkin olduğunu doğrulayın.
4. Production'da mutlaka `DATABASE_URL` tanımlayın (`.data/` yalnızca geliştirme içindir).

### Netlify

`next.config.ts` çıktısı varsayılandır (standalone); `netlify.toml` oluşturup cron için Netlify Scheduled Functions yerine `NODE_ENV=production` iken `@netlify/functions` kullanabilir veya harici bir cron (örn. GitHub Actions / cron-job.org) ile `/api/cron/process-jobs`'u dakikada bir çağırabilirsiniz.

### Custom Domain (DNS)

Vercel: *Dashboard → Project → Settings → Domains* → `www.örneksite.com` ve kök alan adınızı ekleyin. DNS sağlayıcınızda (örn. Namecheap, GoDaddy, Cloudflare):

- **Kök alan (apex)**: `A` kaydı `76.76.21.21` (Vercel) — *veya* ALIAS/ANAME kaydı `cname.vercel-dns.com`.
- **`www`**: `CNAME` kaydı `www` → `cname.vercel-dns.com`.
- Kayıtlar yayıldıktan sonra (1-60 dk) Vercel otomatik SSL sertifikası verir; `NEXT_PUBLIC_APP_URL`'i yeni alan adınıza güncelleyip yeniden deploy edin.

Netlify: *Site settings → Domain management → Add custom domain* → sağlanan hedefe göre `A` / `CNAME` kayıtlarını ekleyin (genelde `75.2.60.5` / `your-site.netlify.app` CNAME).

## Test

```bash
npm run lint
npm run build
```

Smoke test: kayıt ol → `POST /api/cv/from-form` → `/api/cv/[id]/export?format=pdf` | `format=docx` → (B2B rolüyle) `POST /api/b2b/jobs` ile Excel yükle → `GET /api/b2b/jobs/[id]/download` ZIP.

## Notlar

- Yapay zeka anahtarları tanımlı değilken üretilen CV'ler şablon motoruyla (kurallı profesyonelleştirme) üretilir — geliştirme/demo için yeterlidir.
- `.data/` dizini `.gitignore`'dadır; içindeki JSON'lar yalnızca yerel file-store içindir.
- `pdf-test.ts`: PDF üretimini komut satırından test etmek için bağımsız bir betiktir (`npx tsx pdf-test.ts`).
