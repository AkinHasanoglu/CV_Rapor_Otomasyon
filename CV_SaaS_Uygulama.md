# CV & Resume Generator SaaS - Geliştirme Blueprint'i (Claude Code İçin)

## 1. Proje Özeti ve Sistem Kısıtlamaları
Bu proje, bireysel (B2C) ve kurumsal (B2B) kullanıcılara yönelik, yapay zeka destekli bir CV, özgeçmiş ve aday sunum dosyası oluşturma SaaS (Software as a Service) uygulamasıdır. 

**Özel Alan Adı ve Canlıya Alma (Deployment):** Proje kendine ait özel bir alan adıyla (custom domain) yayınlanacaktır. Dağıtım işlemi (deploy) **Vercel veya Netlify** üzerinden yapılacaktır.


**Kritik Sistem Kısıtlaması:** Tüm arka plan görevleri (background tasks), yapay zeka entegrasyonları, dosya dönüştürme ve toplu Excel işleme süreçleri **doğrudan uygulamanın backend yapısı içerisine entegre edilecektir. n8n veya benzeri harici hiçbir otomasyon aracı kullanılmayacaktır.** Uygulama Vercel/Netlify üzerinde çalışacağı için arka plan görevleri sunucusuz (serverless) mimariye uygun (Next.js API Routes, Inngest, Upstash QStash veya BullMQ/Redis uyumlu serverless worker'lar) tasarlanmalıdır.

## 2. Teknoloji Yığını (Tech Stack)
*   **Çatı (Framework):** Next.js (Fullstack yaklaşımı - Frontend ve Backend API Routes aynı projede) VEYA Frontend: Next.js, Backend: Node.js/Python (Eğer backend ayrı bir serviste örneğin Render/Railway'de tutulacaksa). Vercel/Netlify deployment'ı için Next.js Fullstack tercih edilmelidir.
*   **Stil:** Tailwind CSS (Hızlı ve responsive UI).
*   **Arka Plan Görevleri (Serverless Background Workers):** Vercel/Netlify ortamına uygun Upstash QStash, Inngest veya sunucusuz mimaride çalışabilen uyumlu bir kuyruk (queue) servisi.
*   **Veritabanı:** PostgreSQL (Supabase, Neon veya Vercel Postgres gibi serverless uyumlu bir sağlayıcı).
*   **Yapay Zeka:** OpenAI veya Anthropic API (Prompt zincirleri ve metin manipülasyonu için).
*   **Dosya İşleme:** B2B excel ayrıştırma için Excel kütüphaneleri (`xlsx` vb.), PDF ve DOCX çıktısı oluşturmak için ilgili kütüphaneler.

## 3. Bireysel Kullanıcı Modülü (B2C)
Kullanıcılar sisteme giriş yaptıktan sonra iki farklı yöntemle profesyonel CV oluşturabilir. Sistem bu iki akışı sorunsuz yönetmelidir:

### Senaryo A: Taslak Yükleyerek CV Oluşturma
1.  **Girdi:** Kullanıcı elindeki mevcut CV taslağını (PDF, DOCX veya TXT) sisteme yükler. Ayrıca bir "Ek Notlar/Talepler" metin kutusuna, taslağa eklenmesini istediği ekstra bilgileri girer.
2.  **İşlem:** Yapay zeka ajanı, taslaktaki veriyi ayrıştırır, kullanıcının notlarıyla harmanlar, dili profesyonelleştirir, yazım hatalarını düzeltir ve veriyi belirlenen profesyonel bir CV tasarım şablonuna yerleştirir.
3.  **Çıktı:** Tamamen yenilenmiş, profesyonel CV.

### Senaryo B: Sıfırdan Form ile CV Oluşturma
1.  **Girdi:** CV'si olmayan kullanıcı, yapay zekanın profesyonel bir sonuç üretmek için ihtiyaç duyduğu soruları içeren dinamik bir formu doldurur (Eğitim, deneyim, projeler, yetenekler).
2.  **Kritik Özellik:** Kullanıcı bazı form alanlarını boş bırakabilir.
3.  **İşlem:** Yapay zeka bu verileri kullanarak CV'yi oluşturur. Kullanıcının boş bıraktığı ancak CV formatı gereği doldurulması gereken yerlere (örn: proje detayları, referanslar) özel **placeholder'lar (yer tutucular)** ekler.
4.  **Düzenleme ve Çıktı:** Kullanıcı oluşturulan belgede bu placeholder'ları kolayca görüp daha sonra kendi düzenleyebilir.
5.  **İndirme Seçenekleri:** Üretilen her belge PDF ve DOCX formatında indirilebilmelidir.

## 4. Kurumsal Kullanıcı Modülü (B2B)
İnsan kaynakları ve taşeron hizmet veren şirketler için toplu işleme modülüdür. Bu kısım Vercel/Netlify süre sınırlarına (timeout) takılmamak için asenkron (background job) olarak çalışmalıdır.

1.  **Kılavuz ve Onboarding:** Kullanıcı dosya yükleme ekranına girdiğinde doğrudan bir yükleme alanı yerine, önce "Yüklenecek dosyada bulunması gereken veriler ve sütun başlıkları" hakkında detaylı bir **Talimat Kılavuzu / Örnek Şablon** modalı görmelidir.
2.  **Veri Yükleme:** Kullanıcı, talimatlara uygun olarak hazırlanmış Excel (`.xlsx`) veya Google Sheets formatındaki (CSV olarak dışa aktarılmış) dosyasını sisteme yükler.
3.  **Çıktı Tipi Seçimi:** Dosya yüklendikten sonra sistem kullanıcıya şu üç formattan birini seçtirir:
    *   **Profesyonel CV:** Tüm adaylar için detaylı ve standart CV'ler.
    *   **Resume:** Daha kısa, hap bilgi içeren özet özgeçmişler.
    *   **Proje Sunum Dosyası (Taşeron Sunumu):** İK şirketlerinin, bir projeye taşeron ekip sağlarken müşterisine sunabileceği; adayların sadece projeye uygun yetkinliklerini, deneyimlerini öne çıkaran, adayın iletişim bilgilerinin gizlendiği özel formatlı kurumsal sunum şablonu.
4.  **İşlem & Teslimat:** Background worker bu excel dosyasını okur, her bir satır için yapay zeka ajanını çalıştırır, seçilen şablonda dosyaları oluşturur ve tamamlandığında kullanıcıya tüm dosyaları bir ZIP arşivi olarak sunar.

## 5. Temel SaaS Bileşenleri
*   **Landing Page:** Uygulamanın değer önerisini anlatan modern bir ana sayfa.
    *   **Zorunlu Metrik Alanı:** Landing page'in belirgin bir yerinde, "Birlikte çalıştığımız kurumlar" logoları ve "Bu otomasyonla kurumsal müşterilerimizin kazandığı zaman (X saat) ve tasarruf edilen bütçe (Y TL/Dolar)" bilgisini gösteren dinamik/animasyonlu bir ROI (Yatırım Getirisi) metriği bölümü kesinlikle bulunmalıdır.
*   **Standart Sayfalar:** Pricing (Bireysel ve Kurumsal iki ayrı plan), About (Hakkında), Contact (İletişim).
*   **Kimlik Doğrulama:** Sign Up, Sign In sayfaları (Email/Şifre ile).
*   **Ödeme ve Yetkilendirme:** Bireysel ve kurumsal özellikler için Stripe/Iyzico üzerinden iki ayrı abonelik katmanı/ücretlendirme kurgulanmalıdır. Kullanıcı yetkisine (Role-Based Access) göre dashboard arayüzü B2C veya B2B olarak değişmelidir.

## 6. Claude Code İçin Adım Adım Yürütme (Execution) Planı
1.  **Vercel/Netlify Uyumlu Mimari Kurulum:** Projeyi Next.js ile başlat. Vercel veya Netlify deployment'ına uygun şekilde yapılandır (`vercel.json` veya `netlify.toml` oluştur).
2.  **Veritabanı Tasarımı:** Kullanıcı rolleri (Bireysel/Kurumsal), Abonelik Durumu, B2C Belge Geçmişi, B2B Toplu İş Kuyrukları (Job Status) için gerekli tabloları serverless PostgreSQL üzerinde oluştur.
3.  **SaaS Çekirdeği:** Landing Page (Metrik alanı dahil), Auth (Sign In/Up) ve temel dashboard layout'larını kodla.
4.  **Bireysel Modül Geliştirme (Backend + AI):** Dosya ayrıştırma (parsing), AI prompt zinciri (Taslak ve Form senaryoları için), placeholder enjeksiyonu ve PDF/DOCX oluşturma API rotalarını yaz.
5.  **Kurumsal Modül Geliştirme (Backend + Workers):** Excel yükleme endpoint'ini oluştur. Vercel timeout sınırlarına takılmamak için toplu işlemleri background worker'lara (örn. Inngest / QStash) devreden yapıyı (n8n olmadan) kur. Toplu işleme, 3 farklı formatta şablon motoru ve ZIP derleme işlemlerini tamamla.
6.  **Ödeme Entegrasyonu:** Bireysel ve kurumsal planların ödeme altyapısını ve webhook dinleyicilerini bağla. Özel alan adı (Custom Domain) DNS yönlendirmeleri için uygulama içinde yönergeleri/altyapıyı hazırla.