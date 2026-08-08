import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdfkit",
    "pdf-parse",
    "mammoth",
    "xlsx",
    "adm-zip",
    "pg",
  ],
};

export default nextConfig;
