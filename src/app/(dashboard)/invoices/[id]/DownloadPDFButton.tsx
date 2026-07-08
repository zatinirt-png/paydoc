// src/app/(dashboard)/invoices/[id]/DownloadPDFButton.tsx
"use client";

import { useState } from "react";

type Props = {
  invoiceId: string;
  invoiceNo: string;
};

export default function DownloadPDFButton({ invoiceId, invoiceNo }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  function handleDownload() {
    setIsLoading(true);

    // Buka halaman PDF di tab baru — browser auto-trigger print dialog
    // User bisa Save as PDF dari print dialog
    const pdfUrl = `/api/invoices/${invoiceId}/pdf`;
    const win = window.open(pdfUrl, "_blank");

    // Reset loading state setelah tab terbuka
    setTimeout(() => setIsLoading(false), 1500);
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-[#1a1f5e]/20 bg-[#1a1f5e]/5 text-[#1a1f5e] hover:bg-[#1a1f5e]/10 disabled:opacity-60 transition-colors"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Membuka...
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download PDF
        </>
      )}
    </button>
  );
}