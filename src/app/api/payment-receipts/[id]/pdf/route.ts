// src/app/api/payment-receipts/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { COMPANY } from "@/lib/company";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}
function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

const TYPE_LABEL: Record<string, string> = {
  FREELANCER: "Freelancer",
  VENDOR: "Vendor",
  INTERNAL: "Internal",
};
const METHOD_LABEL: Record<string, string> = {
  transfer: "Transfer Bank",
  cash: "Tunai",
  ewallet: "E-Wallet",
  cheque: "Cek",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id },
    include: {
      partner: true,
      lineItems: { orderBy: { order: "asc" } },
      paymentProof: true,
    },
  });
  if (!receipt) return new NextResponse("Not found", { status: 404 });

  const total = Number(receipt.totalAmount);

  const proof = receipt.paymentProof[0] ?? null;
  const origin = request.nextUrl.origin;
  const proofUrl = proof
    ? `${origin}/uploads/payment-proofs/${proof.filename}`
    : null;
  const isImageProof = proof && proof.mimeType.startsWith("image/");
  const isPdfProof = proof && proof.mimeType === "application/pdf";

  // Layout 2 kolom kalau ada foto bukti — hemat ruang vertikal signifikan
  const proofHTML = proof
    ? `
  <div class="proof-section">
    <div class="section-label">Bukti Transfer</div>
    ${
      isImageProof
        ? `<div class="proof-image-box"><img src="${proofUrl}" alt="Bukti transfer" /></div>`
        : isPdfProof
          ? `<div class="proof-pdf-box">
            <div class="pdf-icon">PDF</div>
            <span>Bukti transfer (PDF) terlampir</span>
          </div>`
          : ""
    }
  </div>`
    : "";

  const lineItemsHTML = receipt.lineItems
    .map(
      (item) => `
    <tr>
      <td class="desc">${item.description}</td>
      <td class="center">${Number(item.quantity)}</td>
      <td class="right">${formatIDR(Number(item.unitPrice))}</td>
      <td class="right bold">${formatIDR(Number(item.totalPrice))}</td>
    </tr>`,
    )
    .join("");

  // Kolom kanan (sidebar) hanya dipakai kalau ada bukti foto, supaya layout tetap rapi tanpa foto
  const hasProofImage = isImageProof;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Bukti Pembayaran ${receipt.receiptNo} — ${COMPANY.name}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html{height:100%}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      font-size:11.5px;color:#111;background:white;
      padding:28px 32px;max-width:760px;margin:0 auto;
      min-height:100vh;
      display:flex;flex-direction:column;
    }
    .main-content{flex:0 0 auto}
    .bottom-section{margin-top:auto;flex:0 0 auto}

    /* Header */
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
    .logo-box{width:36px;height:36px;background:#1a1f5e;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:12px;margin-bottom:8px}
    .company-name{font-weight:900;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
    .company-address{font-size:9.5px;color:#888;line-height:1.5;margin-top:3px}
    .doc-title{text-align:right}
    .doc-title h1{font-size:21px;font-weight:900;text-transform:uppercase;letter-spacing:-.01em}
    .doc-no{font-size:11px;font-weight:600;color:#999;margin-top:2px}
    .doc-dates{margin-top:5px;font-size:9.5px;color:#888;line-height:1.5}
    .doc-method{margin-top:3px;font-size:9.5px;font-weight:700;color:#1a1f5e}
    .divider{border:none;border-top:2px solid #111;margin-bottom:14px}

    /* Billing */
    .billing-row{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:1px solid #f0f0f0;margin-bottom:14px}
    .section-label{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa;margin-bottom:5px}
    .partner-name{font-weight:700;font-size:12.5px}
    .partner-type{display:inline-block;margin-top:3px;font-size:8.5px;font-weight:700;color:#1a1f5e;background:#e8eaf6;padding:1px 7px;border-radius:20px}
    .partner-detail{font-size:9.5px;color:#888;margin-top:3px;line-height:1.5}
    .total-due{text-align:right}
    .total-amount{font-size:21px;font-weight:900;color:#1a1f5e}

    .desc-box{background:#f8f9fa;border-radius:8px;padding:10px 12px;margin-bottom:14px}
    .desc-label{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#aaa;margin-bottom:4px}
    .desc-text{font-size:10.5px;color:#444;line-height:1.5}

    /* Two-column layout when proof image exists: table left, proof right */
    .content-grid{display:${hasProofImage ? "grid" : "block"};grid-template-columns:${hasProofImage ? "1.4fr 1fr" : "1fr"};gap:18px;margin-bottom:12px}

    table{width:100%;border-collapse:collapse;margin-bottom:10px}
    thead tr{border-bottom:1.5px solid #111}
    thead th{padding:5px 0;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#555;text-align:left}
    tbody tr{border-bottom:1px solid #f5f5f5}
    tbody td{padding:7px 0;font-size:10px;color:#333}
    .desc{width:48%}.center{text-align:center}.right{text-align:right}.bold{font-weight:700}

    .total-row{display:flex;justify-content:flex-end;margin-bottom:0}
    .total-box{width:190px;border-top:1.5px solid #111;padding-top:6px;display:flex;justify-content:space-between;font-weight:900;font-size:11.5px}
    .total-box .amount{color:#1a1f5e;font-size:13px}

    /* Proof sidebar */
    .proof-section{margin-bottom:0}
    .proof-image-box{border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;background:#f8f9fa;text-align:center;height:100%;display:flex;align-items:center;justify-content:center}
    .proof-image-box img{width:100%;max-height:230px;object-fit:contain}
    .proof-pdf-box{display:flex;align-items:center;gap:8px;background:#f8f9fa;border:1px solid #e5e5e5;border-radius:8px;padding:10px;font-size:10px;color:#666}
    .pdf-icon{width:28px;height:28px;background:#fee2e2;color:#dc2626;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:8px;flex-shrink:0}

    /* Signatures */
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:20px;margin-bottom:16px}
    .sig-box{border:1px solid #e5e5e5;border-radius:8px;padding:12px 14px}
    .sig-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#999;margin-bottom:4px}
    .sig-space{height:80px;display:flex;align-items:flex-end;justify-content:center;color:#ddd;font-size:9px;font-style:italic}
    .sig-line{border-top:1px solid #bbb;padding-top:6px;margin-top:4px}
    .sig-name{font-size:11px;font-weight:700}
    .sig-date{font-size:9.5px;color:#888;margin-top:1px}

    .notes-section{padding-top:10px;border-top:1px solid #f0f0f0;margin-bottom:10px}

    .footer{text-align:center;font-size:8.5px;color:#ccc;border-top:1px solid #f0f0f0;padding-top:10px;margin-top:6px}

    @media print{
      html,body{height:297mm}
      body{padding:18px 24px;min-height:297mm}
      @page{margin:0;size:A4}
    }
  </style>
</head>
<body>
  <div class="main-content">
  <div class="header">
    <div>
      <div class="logo-box">${COMPANY.initials}</div>
      <div class="company-name">${COMPANY.name}</div>
      <div class="company-address">${COMPANY.address.replace(/\n/g, "<br>")}</div>
    </div>
    <div class="doc-title">
      <h1>Bukti Pembayaran</h1>
      <div class="doc-no">#${receipt.receiptNo}</div>
      <div class="doc-dates">
        Tanggal: ${formatDate(receipt.issueDate)}<br>
        ${receipt.paymentDate ? `Tgl. Bayar: ${formatDate(receipt.paymentDate)}` : ""}
      </div>
      ${receipt.paymentMethod ? `<div class="doc-method">${METHOD_LABEL[receipt.paymentMethod] ?? receipt.paymentMethod}</div>` : ""}
    </div>
  </div>

  <hr class="divider"/>

  <div class="billing-row">
    <div>
      <div class="section-label">Kepada / Penerima</div>
      <div class="partner-name">${receipt.partner.name}</div>
      <div class="partner-type">${TYPE_LABEL[receipt.partner.type] ?? receipt.partner.type}</div>
      ${receipt.partner.email ? `<div class="partner-detail">${receipt.partner.email}</div>` : ""}
      ${
        receipt.partner.bankName && receipt.partner.bankAccount
          ? `<div class="partner-detail">${receipt.partner.bankName} · <strong>${receipt.partner.bankAccount}</strong></div>`
          : ""
      }
    </div>
    <div class="total-due">
      <div class="section-label">Total Dibayar</div>
      <div class="total-amount">${formatIDR(total)}</div>
    </div>
  </div>

  <div class="desc-box">
    <div class="desc-label">Keterangan</div>
    <div class="desc-text">${receipt.description}</div>
  </div>

  <div class="content-grid">
    <div>
      <table>
        <thead>
          <tr>
            <th class="desc">Rincian</th>
            <th class="center">Qty</th>
            <th class="right">Harga</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>${lineItemsHTML}</tbody>
      </table>
      <div class="total-row">
        <div class="total-box">
          <span>Total</span>
          <span class="amount">${formatIDR(total)}</span>
        </div>
      </div>
    </div>
    ${hasProofImage ? proofHTML : ""}
  </div>

  ${!hasProofImage ? proofHTML : ""}
  </div>

  <div class="bottom-section">
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-label">Yang Membayar</div>
      <div class="sig-space"></div>
      <div class="sig-line">
        <div class="sig-name">${COMPANY.name}</div>
        <div class="sig-date">Tanggal: ${formatDate(receipt.issueDate)}</div>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-label">Yang Menerima</div>
      <div class="sig-space"></div>
      <div class="sig-line">
        <div class="sig-name">${receipt.partner.name}</div>
        <div class="sig-date">Tanggal: ${receipt.paymentDate ? formatDate(receipt.paymentDate) : "_______________"}</div>
      </div>
    </div>
  </div>

  ${
    receipt.notes
      ? `
  <div class="notes-section">
    <div class="desc-label">Catatan</div>
    <div class="desc-text">${receipt.notes}</div>
  </div>`
      : ""
  }

  <div class="footer">
    Generated by ${COMPANY.name} · PayDoc · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
  </div>
  </div>

  <script>window.onload=()=>window.print()</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="BuktiPembayaran-${receipt.receiptNo}.pdf"`,
    },
  });
}
