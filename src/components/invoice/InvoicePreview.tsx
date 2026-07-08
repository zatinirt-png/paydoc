// src/components/invoice/InvoicePreview.tsx
// Taruh di: src/components/invoice/InvoicePreview.tsx

import { COMPANY } from "@/lib/company";
import { formatIDR, formatDate } from "@/lib/utils";

export type InvoicePreviewData = {
  invoiceNo: string;
  issueDate: string;
  dueDate?: string;
  status?: string;
  client: {
    name: string;
    address?: string | null;
    email?: string | null;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  terms?: string | null;
};

const PAYMENT = {
  bank:       "Bank Central Asia (BCA)",
  bankShort:  "BCA",
  accountNo:  "7751 6899 97",
  accountName: "Yudhistira Haryatmaka & Arendryo Rakadwitya",
} as const;

export default function InvoicePreview({
  data,
  printMode = false,
}: {
  data: InvoicePreviewData;
  printMode?: boolean;
}) {
  const base = printMode
    ? "bg-white font-sans text-gray-900"
    : "bg-white rounded-xl shadow-sm border border-gray-100 font-sans";

  return (
    <div className={`${base} p-8`} id="invoice-preview">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="w-12 h-12 bg-[#1a1f5e] rounded-xl flex items-center justify-center text-white font-black text-base mb-3 select-none">
            {COMPANY.initials}
          </div>
          <p className="font-black text-gray-900 text-sm tracking-wide uppercase">
            {COMPANY.name}
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed whitespace-pre-line">
            {COMPANY.address}
          </p>
        </div>

        <div className="text-right">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">INVOICE</h2>
          <p className="text-sm font-semibold text-gray-400 mt-1">#{data.invoiceNo}</p>
          <div className="mt-2 space-y-0.5">
            <p className="text-xs text-gray-400">
              Date: {data.issueDate ? formatDate(data.issueDate) : "—"}
            </p>
            {data.dueDate && (
              <p className="text-xs text-gray-400">Due: {formatDate(data.dueDate)}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bill To + Total Due ── */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Bill To
          </p>
          {data.client.name ? (
            <>
              <p className="font-bold text-gray-900 text-sm">{data.client.name}</p>
              {data.client.address && (
                <p className="text-xs text-gray-400 mt-1 whitespace-pre-line leading-relaxed">
                  {data.client.address}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-300 italic">Pilih klien...</p>
          )}
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Total Due
          </p>
          <p className="text-3xl font-black text-[#1a1f5e]">
            {formatIDR(data.totalAmount)}
          </p>
        </div>
      </div>

      {/* ── Line Items ── */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-900">
            <th className="text-left pb-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              Description
            </th>
            <th className="text-center pb-2 text-xs font-bold text-gray-700 uppercase tracking-wider w-14">
              Qty
            </th>
            <th className="text-right pb-2 text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
              Price
            </th>
            <th className="text-right pb-2 text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.filter((i) => i.description).length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-sm text-gray-300 italic">
                Tambah line item...
              </td>
            </tr>
          ) : (
            data.lineItems
              .filter((i) => i.description)
              .map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-800">{item.description}</td>
                  <td className="py-3 text-sm text-center text-gray-500">{item.quantity}</td>
                  <td className="py-3 text-sm text-right text-gray-500">{formatIDR(item.unitPrice)}</td>
                  <td className="py-3 text-sm text-right font-semibold text-gray-800">
                    {formatIDR(item.totalPrice)}
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>

      {/* ── Totals ── */}
      <div className="flex justify-end mb-6">
        <div className="w-56 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatIDR(data.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax ({data.taxPercent}%)</span>
            <span>{formatIDR(data.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-[#1a1f5e]">{formatIDR(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* ── Payment Destination ── */}
      <div className="pt-6 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Tujuan Pembayaran
        </p>
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xs tracking-tight">{PAYMENT.bankShort}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{PAYMENT.bank}</p>
            <p className="text-xs text-gray-500 mt-0.5">a/n {PAYMENT.accountName}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
              No. Rekening
            </p>
            <p className="text-base font-black text-gray-900 tracking-widest">
              {PAYMENT.accountNo}
            </p>
          </div>
        </div>
      </div>

      {/* ── Notes & Terms ── */}
      {(data.notes || data.terms) && (
        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
          {data.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-gray-500 leading-relaxed">{data.notes}</p>
            </div>
          )}
          {data.terms && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Payment Terms
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">{data.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-8 pt-6 border-t border-gray-50 text-center">
        <p className="text-xs text-gray-300">Generated by {COMPANY.name} · PayDoc</p>
      </div>

    </div>
  );
}