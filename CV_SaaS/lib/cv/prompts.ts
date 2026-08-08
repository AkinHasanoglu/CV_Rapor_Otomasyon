/**
 * Prompt zinciri tanımları: AI ajanına verilen sistem/insan promptları.
 * Üç aşama blueprint'teki akışa birebir uyar:
 *  1) Ayrıştırma  2) Harmanlama (notlar)  3) Profesyonelleştirme + şablona eşleme
 */
export const CV_SYSTEM_PROMPT = `Sen, dünya standartlarında profesyonel CV'ler üreten uzman bir kariyer koçusun.
Görevin, kullanıcıdan gelen ham CV verisini:
1. Ayrıştırmak (parse) — eksik veya düzensiz veriyi anlamlandırmak,
2. Kullanıcının ek notlarıyla harmanlamak,
3. Dili profesyonelleştirmek: yazım hatalarını düzelt, başarı odaklı (achievement-oriented) ve ölçülebilir ifadeler kullan,
4. Aşağıdaki JSON şemasına birebir uygun, eksiksiz bir CV objesi döndürmek.

KURALLAR:
- SADECE geçerli bir JSON objesi döndür. Açıklama, markdown, kod bloğu YAZMA.
- Kullanıcının boş bıraktığı ama CV'de olması gereken alanlara kısa, gerçekçi bir yer tutucu metin yaz: {{buraya ... yazın}} biçiminde.
- fullName/email/phone gibi kişisel alanlar asla uydurma; bilinmiyorsa boş bırak.
- Diller, Türkçe ve İngilizce karışık gelse de CV içeriğini Türkçe kullanıcılar için Türkçe, metin İngilizceyse İngilizce üret.
- Deneyim açıklamalarında 2-4 madde halinde "achievements" kullan (ölçülebilir sonuçlar).

JSON ŞEMASI:
{
  "fullName": string, "title": string, "email": string, "phone": string,
  "location": string, "linkedin": string, "website": string,
  "summary": string,
  "skills": string[],
  "experience": [ { "role": string, "company": string, "location": string, "startDate": string, "endDate": string, "description": string, "achievements": string[] } ],
  "education": [ { "degree": string, "institution": string, "startDate": string, "endDate": string, "gpa": string } ],
  "projects": [ { "name": string, "description": string, "link": string, "technologies": string[] } ],
  "certifications": string[],
  "languages": string[],
  "references": string[]
}`;

export function draftPrompt(draftText: string, notes: string): string {
  return `Aşağıdaki CV taslağını ve kullanıcı notlarını kullanarak eksiksiz bir CV objesi üret.

=== KULLANICI TASLAĞI ===
${draftText.slice(0, 20000)}

=== EK NOTLAR / TALEPLER ===
${notes.trim() || "(not yok)"}

Yukarıdaki şemaya uygun JSON döndür.`;

}

export function formPrompt(formJson: string): string {
  return `Kullanıcı aşağıdaki formu doldurdu. Boş bıraktığı alanlar CV'de gerekiyorsa
{{...}} biçiminde yer tutucular ekleyerek profesyonel bir CV objesi üret.

=== FORM VERİSİ ===
${formJson}

Yukarıdaki şemaya uygun JSON döndür.`;
}

/** B2B toplu işleme: her aday satırı için kısa CV objesi üretimi */
export function b2bPrompt(rowJson: string, outputType: string): string {
  const focus =
    outputType === "resume"
      ? "KISA ve öz: yalnızca en kritik deneyim ve beceriler (maks 1 sayfa)."
      : outputType === "project"
        ? "TAŞERON SUNUMU: yalnızca projeye uygun yetkinlikleri ve ölçülebilir deneyimleri öne çıkar, iletişim bilgilerini GİZLE (email/phone/linkedin boş bırak), şirket içi unvanı jenerik bir role çevir."
        : "DETAYLI ve standart profesyonel CV: tüm deneyim, eğitim, beceri ve projeleri kapsa.";
  return `Aşağıdaki Excel satırındaki aday verisinden bir CV objesi üret.

=== ADAY VERİSİ ===
${rowJson}

FORMAT: ${focus}
Yukarıdaki şemaya uygun JSON döndür.`;
}
