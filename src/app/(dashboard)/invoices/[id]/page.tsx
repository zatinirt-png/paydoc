// src/app/(dashboard)/invoices/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoiceById, updateInvoiceStatus, deleteInvoice } from "@/actions/invoice.actions";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import DownloadPDFButton from "./DownloadPDFButton";

const STATUS_STYLE: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SENT: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-400",
};

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; style: string }[]> = {
    DRAFT: [
        { label: "Mark as Sent", next: "SENT", style: "bg-[#1a1f5e] text-white border-[#1a1f5e] hover:bg-[#252b7a]" },
        { label: "Cancel", next: "CANCELLED", style: "bg-white text-red-500 border-red-200 hover:bg-red-50" },
    ],
    SENT: [
        { label: "Mark as Paid", next: "PAID", style: "bg-green-600 text-white border-green-600 hover:bg-green-700" },
        { label: "Mark as Overdue", next: "OVERDUE", style: "bg-white text-orange-500 border-orange-200 hover:bg-orange-50" },
        { label: "Cancel", next: "CANCELLED", style: "bg-white text-red-500 border-red-200 hover:bg-red-50" },
    ],
    OVERDUE: [
        { label: "Mark as Paid", next: "PAID", style: "bg-green-600 text-white border-green-600 hover:bg-green-700" },
        { label: "Cancel", next: "CANCELLED", style: "bg-white text-red-500 border-red-200 hover:bg-red-50" },
    ],
    PAID: [],
    CANCELLED: [],
};

export default async function InvoiceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const invoice = await getInvoiceById(id);
    if (!invoice) notFound();

    const transitions = STATUS_TRANSITIONS[invoice.status] ?? [];

    const previewData = {
        invoiceNo: invoice.invoiceNo,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString(),
        status: invoice.status,
        client: {
            name: invoice.client.name,
            address: invoice.client.address,
            email: invoice.client.email,
        },
        lineItems: invoice.lineItems.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
            totalPrice: Number(li.totalPrice),
        })),
        subtotal: Number(invoice.subtotal),
        taxPercent: Number(invoice.taxPercent),
        taxAmount: Number(invoice.taxAmount),
        totalAmount: Number(invoice.totalAmount),
        notes: invoice.notes,
        terms: invoice.terms,
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back */}
            <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Kembali ke Invoices
            </Link>

            {/* Top bar */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNo}</h1>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[invoice.status]}`}>
                            {invoice.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400">
                        Dibuat oleh {invoice.createdBy.name}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Edit — hanya untuk DRAFT */}
                    {invoice.status === "DRAFT" && (
                        <Link
                            href={`/invoices/${id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                        </Link>
                    )}

                    {/* Download PDF */}
                    <DownloadPDFButton invoiceId={id} invoiceNo={invoice.invoiceNo} />

                    {/* Status transitions */}
                    {transitions.map((t) => (
                        <form key={t.next} action={async () => {
                            "use server";
                            await updateInvoiceStatus(id, t.next as any);
                        }}>
                            <button type="submit"
                                className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${t.style}`}>
                                {t.label}
                            </button>
                        </form>
                    ))}
                </div>
            </div>

            {/* Invoice preview — reuse komponen yang sama */}
            <InvoicePreview data={previewData} />

            {/* Hapus — hanya DRAFT */}
            {invoice.status === "DRAFT" && (
                <div className="mt-4 flex justify-end">
                    <form action={async () => {
                        "use server";
                        await deleteInvoice(id);
                    }}>
                        <button type="submit" className="text-sm text-red-400 hover:text-red-600 transition-colors">
                            Hapus invoice ini
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}