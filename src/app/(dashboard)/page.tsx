// src/app/(dashboard)/page.tsx
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

async function getRecentDocuments() {
  const [invoices, receipts] = await Promise.all([
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    }),
    prisma.paymentReceipt.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { partner: { select: { name: true } } },
    }),
  ]);

  const combined = [
    ...invoices.map((inv) => ({
      id: inv.id,
      type: "invoice" as const,
      name: `Invoice #${inv.invoiceNo}`,
      party: inv.client.name,
      date: inv.issueDate,
      status: inv.status,
      href: `/invoices/${inv.id}`,
    })),
    ...receipts.map((r) => ({
      id: r.id,
      type: "receipt" as const,
      name: `Payment Record - ${r.partner.name}`,
      party: r.partner.name,
      date: r.issueDate,
      status: r.status,
      href: `/payment-receipts/${r.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return combined;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     "bg-gray-100 text-gray-500",
  SENT:      "bg-blue-100 text-blue-600",
  PAID:      "bg-green-100 text-green-600",
  COMPLETED: "bg-green-100 text-green-600",
  ISSUED:    "bg-blue-100 text-blue-600",
  OVERDUE:   "bg-red-100 text-red-600",
  CANCELLED: "bg-red-100 text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", SENT: "Sent", PAID: "Paid",
  ISSUED: "Issued", OVERDUE: "Overdue", CANCELLED: "Cancelled",
};

function InvoiceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const recentDocs = await getRecentDocuments();

  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Overview of your business documents and financial activity.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Create Invoice */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Create Invoice</h3>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Generate professional bills for your clients in seconds.
            </p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1f5e] hover:bg-[#252b7a] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              New Invoice
            </Link>
          </div>
          <div className="text-gray-100 ml-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
        </div>

        {/* Create Payment Record */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Create Payment Record</h3>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Manually log external payments and reconcile accounts.
            </p>
            <Link
              href="/payment-receipts/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              Record Payment
            </Link>
          </div>
          <div className="text-gray-100 ml-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              <line x1="6" y1="15" x2="10" y2="15"/><line x1="6" y1="18" x2="8" y2="18"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm">Recent Documents</h3>
          <Link
            href="/invoices"
            className="text-sm text-[#1a1f5e] hover:underline font-medium"
          >
            View All Documents
          </Link>
        </div>

        {recentDocs.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Belum ada dokumen. Mulai dengan membuat invoice atau payment record.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Document Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc, i) => (
                <tr
                  key={doc.id}
                  className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${
                    i % 2 === 0 ? "" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gray-50 rounded-md flex items-center justify-center">
                        {doc.type === "invoice" ? <InvoiceIcon /> : <ReceiptIcon />}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {formatDate(doc.date)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_STYLE[doc.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABEL[doc.status] ?? doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={doc.href}
                      className="text-sm text-[#1a1f5e] hover:underline font-medium inline-flex items-center gap-1"
                    >
                      View
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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