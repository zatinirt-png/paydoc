// src/app/(dashboard)/invoices/page.tsx
import Link from "next/link";
import { getInvoices } from "@/actions/invoice.actions";
import { formatIDR, formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     "bg-gray-100 text-gray-500",
  SENT:      "bg-blue-100 text-blue-600",
  PAID:      "bg-green-100 text-green-600",
  OVERDUE:   "bg-red-100 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-400 line-through",
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params  = await searchParams;
  const status  = params.status;
  const invoices = await getInvoices(status ? { status } : undefined);

  const tabs = [
    { label: "All",       value: undefined  },
    { label: "Draft",     value: "DRAFT"    },
    { label: "Sent",      value: "SENT"     },
    { label: "Paid",      value: "PAID"     },
    { label: "Overdue",   value: "OVERDUE"  },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a1f5e] hover:bg-[#252b7a] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const isActive = status === tab.value || (!status && !tab.value);
          const href = tab.value ? `/invoices?status=${tab.value}` : "/invoices";
          return (
            <Link
              key={tab.label}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-3 text-gray-200" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="text-gray-400 text-sm font-medium">Belum ada invoice</p>
            <Link
              href="/invoices/new"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#1a1f5e] hover:underline font-semibold"
            >
              Buat invoice pertama →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-50">
              <tr>
                {["Invoice #", "Client", "Date", "Due Date", "Amount", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                    {inv.invoiceNo}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {inv.client.name}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {formatDate(inv.issueDate)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                    {formatIDR(Number(inv.totalAmount))}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_STYLE[inv.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-sm text-[#1a1f5e] hover:underline font-medium inline-flex items-center gap-1"
                    >
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