// src/app/api/invoices/[id]/pdf/route.ts
// Taruh di: src/app/api/invoices/[id]/pdf/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { COMPANY } from "@/lib/company";

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(date));
}

const PAYMENT = {
  bank:        "Bank Central Asia (BCA)",
  bankShort:   "BCA",
  accountNo:   "7751 6899 97",
  accountName: "Yudhistira Haryatmaka & Arendryo Rakadwitya",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where:   { id },
    include: { client: true, lineItems: { orderBy: { order: "asc" } } },
  });

  if (!invoice) return new NextResponse("Invoice not found", { status: 404 });

  const subtotal    = Number(invoice.subtotal);
  const taxPercent  = Number(invoice.taxPercent);
  const taxAmount   = Number(invoice.taxAmount);
  const totalAmount = Number(invoice.totalAmount);

  const lineItemsHTML = invoice.lineItems.map((item) => `
    <tr>
      <td class="desc">${item.description}</td>
      <td class="center">${Number(item.quantity)}</td>
      <td class="right">${formatIDR(Number(item.unitPrice))}</td>
      <td class="right bold">${formatIDR(Number(item.totalPrice))}</td>
    </tr>
  `).join("");

  const notesAndTerms = (invoice.notes || invoice.terms) ? `
    <div class="extras">
      ${invoice.notes ? `
      <div>
        <div class="extra-label">Notes</div>
        <div class="extra-text">${invoice.notes}</div>
      </div>` : ""}
      ${invoice.terms ? `
      <div>
        <div class="extra-label">Payment Terms</div>
        <div class="extra-text">${invoice.terms}</div>
      </div>` : ""}
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.invoiceNo} — ${COMPANY.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px; color: #111; background: white;
      padding: 48px; max-width: 800px; margin: 0 auto;
    }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo-box {
      width: 48px; height: 48px; background: #1a1f5e; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 900; font-size: 15px; margin-bottom: 12px;
    }
    .company-name { font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
    .company-address { font-size: 11px; color: #888; line-height: 1.6; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 38px; font-weight: 900; letter-spacing: -0.02em; }
    .invoice-no { font-size: 13px; font-weight: 600; color: #999; margin-top: 4px; }
    .invoice-dates { margin-top: 8px; font-size: 11px; color: #888; line-height: 1.7; }

    /* Billing */
    .billing-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding-bottom: 24px; border-bottom: 1px solid #f0f0f0; margin-bottom: 32px;
    }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa; margin-bottom: 8px; }
    .client-name { font-weight: 700; font-size: 14px; }
    .client-detail { font-size: 11px; color: #888; line-height: 1.6; margin-top: 4px; }
    .total-due { text-align: right; }
    .total-amount { font-size: 30px; font-weight: 900; color: #1a1f5e; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { border-bottom: 2px solid #111; }
    thead th { padding: 8px 0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #555; text-align: left; }
    tbody tr { border-bottom: 1px solid #f5f5f5; }
    tbody td { padding: 12px 0; font-size: 12px; color: #333; }
    .desc { width: 50%; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }

    /* Totals */
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-box { width: 220px; }
    .totals-row { display: flex; justify-content: space-between; font-size: 12px; color: #666; padding: 4px 0; }
    .totals-row.grand { border-top: 1px solid #e0e0e0; margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 13px; color: #111; }
    .totals-row.grand .amount { color: #1a1f5e; font-size: 15px; }

    /* Payment destination */
    .payment-section { margin-bottom: 24px; }
    .payment-box {
      display: flex; align-items: center; gap: 16px;
      background: #f8f9fa; border-radius: 12px; padding: 16px;
    }
    .bank-badge {
      width: 40px; height: 40px; background: #1d4ed8; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 900; font-size: 11px; flex-shrink: 0;
    }
    .bank-info { flex: 1; }
    .bank-name { font-weight: 700; font-size: 13px; }
    .bank-an { font-size: 11px; color: #666; margin-top: 2px; }
    .account-block { text-align: right; flex-shrink: 0; }
    .account-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 2px; }
    .account-no { font-size: 16px; font-weight: 900; letter-spacing: 0.1em; }

    /* Notes / Terms */
    .extras { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding-top: 24px; border-top: 1px solid #f0f0f0; margin-bottom: 32px; }
    .extra-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 6px; }
    .extra-text { font-size: 11px; color: #666; line-height: 1.6; }

    /* Footer */
    .footer { text-align: center; font-size: 10px; color: #ccc; border-top: 1px solid #f0f0f0; padding-top: 20px; }

    @media print {
      body { padding: 32px; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="logo-box">${COMPANY.initials}</div>
      <div class="company-name">${COMPANY.name}</div>
      <div class="company-address">
        ${COMPANY.address.replace(/\n/g, "<br>")}
      </div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="invoice-no">#${invoice.invoiceNo}</div>
      <div class="invoice-dates">
        Date: ${formatDate(invoice.issueDate)}<br>
        ${invoice.dueDate ? `Due: ${formatDate(invoice.dueDate)}` : ""}
      </div>
    </div>
  </div>

  <div class="billing-row">
    <div>
      <div class="section-label">Bill To</div>
      <div class="client-name">${invoice.client.name}</div>
      <div class="client-detail">
        ${invoice.client.address ? invoice.client.address.replace(/\n/g, "<br>") : ""}
      </div>
    </div>
    <div class="total-due">
      <div class="section-label">Total Due</div>
      <div class="total-amount">${formatIDR(totalAmount)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="desc">Description</th>
        <th class="center">Qty</th>
        <th class="right">Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${lineItemsHTML}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${formatIDR(subtotal)}</span></div>
      <div class="totals-row"><span>Tax (${taxPercent}%)</span><span>${formatIDR(taxAmount)}</span></div>
      <div class="totals-row grand"><span>Total</span><span class="amount">${formatIDR(totalAmount)}</span></div>
    </div>
  </div>

  <!-- Tujuan Pembayaran -->
  <div class="payment-section">
    <div class="section-label" style="margin-bottom: 10px;">Tujuan Pembayaran</div>
    <div class="payment-box">
      <div class="bank-badge">${PAYMENT.bankShort}</div>
      <div class="bank-info">
        <div class="bank-name">${PAYMENT.bank}</div>
        <div class="bank-an">a/n ${PAYMENT.accountName}</div>
      </div>
      <div class="account-block">
        <div class="account-label">No. Rekening</div>
        <div class="account-no">${PAYMENT.accountNo}</div>
      </div>
    </div>
  </div>

  ${notesAndTerms}

  <div class="footer">
    Generated by ${COMPANY.name} · PayDoc · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="Invoice-${invoice.invoiceNo}.pdf"`,
    },
  });
}