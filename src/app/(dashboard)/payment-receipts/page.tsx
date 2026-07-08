// src/app/(dashboard)/payment-receipts/page.tsx
import Link from "next/link";
import { getPaymentReceipts } from "@/actions/payment-receipt.actions";
import { formatIDR, formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     "bg-gray-100 text-gray-500",
  ISSUED:    "bg-blue-100 text-blue-600",
  PAID:      "bg-green-100 text-green-600",
  CANCELLED: "bg-gray-100 text-gray-400",
};
const TYPE_LABEL: Record<string, string> = {
  FREELANCER: "Freelancer", VENDOR: "Vendor", INTERNAL: "Internal",
};

export default async function PaymentReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params   = await searchParams;
  const receipts = await getPaymentReceipts(params.status ? { status: params.status } : undefined);

  const tabs = [
    { label: "All",      value: undefined   },
    { label: "Draft",    value: "DRAFT"     },
    { label: "Issued",   value: "ISSUED"    },
    { label: "Paid",     value: "PAID"      },
    { label: "Cancelled",value: "CANCELLED" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Receipts</h2>
          <p className="text-sm text-gray-400 mt-0.5">{receipts.length} bukti pembayaran</p>
        </div>
        <Link href="/payment-receipts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a1f5e] hover:bg-[#252b7a] text-white text-sm font-semibold rounded-xl transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Buat Bukti Pembayaran
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const isActive = params.status === tab.value || (!params.status && !tab.value);
          const href = tab.value ? `/payment-receipts?status=${tab.value}` : "/payment-receipts";
          return (
            <Link key={tab.label} href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {receipts.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-3 text-gray-200" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <p className="text-gray-400 text-sm font-medium">Belum ada bukti pembayaran</p>
            <Link href="/payment-receipts/new" className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#1a1f5e] hover:underline font-semibold">
              Buat yang pertama →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-50">
              <tr>
                {["No. Dokumen", "Partner", "Tanggal", "Metode", "Total", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">{r.receiptNo}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-800">{r.partner.name}</p>
                    <p className="text-xs text-gray-400">{TYPE_LABEL[r.partner.type] ?? r.partner.type}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">{formatDate(r.issueDate)}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {r.paymentMethod ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                    {formatIDR(Number(r.totalAmount))}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/payment-receipts/${r.id}`}
                      className="text-sm text-[#1a1f5e] hover:underline font-medium inline-flex items-center gap-1">
                      View
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}