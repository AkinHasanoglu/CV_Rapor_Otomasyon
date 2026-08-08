import { renderPdf } from "./lib/cv/generate-pdf";
import { emptyCandidate } from "./lib/cv/types";

async function main() {
  const cv = emptyCandidate();
  cv.fullName = "Ayşe Yılmaz";
  cv.title = "Frontend Developer";
  cv.summary = "Test özet metni";
  cv.skills = ["React", "TypeScript", "SQL"];
  cv.experience = [
    {
      role: "Frontend Dev",
      company: "XYZ",
      location: "İstanbul",
      startDate: "2021",
      endDate: "2024",
      description: "Sipariş modülü",
      achievements: ["2x performans"],
    },
  ];
  const buf = await renderPdf(cv);
  console.log("PDF bytes:", buf.length);
}

main();
