// src/app/(dashboard)/payment-receipts/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPaymentReceiptById, updateReceiptStatus, deletePaymentReceipt } from "@/actions/payment-receipt.actions";
import PaymentReceiptPreview from "@/components/receipt/PaymentReceiptPreview";
import ProofUploader from "@/components/receipt/ProofUploader";
import DownloadReceiptButton from "./DownloadReceiptButton";

const STATUS_STYLE: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    ISSUED: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-400",
};

const TRANSITIONS: Record<string, { label: string; next: string; style: string }[]> = {
    DRAFT: [
        { label: "Terbitkan", next: "ISSUED", style: "bg-[#1a1f5e] text-white border-[#1a1f5e] hover:bg-[#252b7a]" },
        { label: "Batalkan", next: "CANCELLED", style: "bg-white text-red-500 border-red-200 hover:bg-red-50" },
    ],
    ISSUED: [
        { label: "Tandai Lunas", next: "PAID", style: "bg-green-600 text-white border-green-600 hover:bg-green-700" },
        { label: "Batalkan", next: "CANCELLED", style: "bg-white text-red-500 border-red-200 hover:bg-red-50" },
    ],
    PAID: [],
    CANCELLED: [],
};

export default async function ReceiptDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const receipt = await getPaymentReceiptById(id);
    if (!receipt) notFound();

    const transitions = TRANSITIONS[receipt.status] ?? [];
    const proof = receipt.paymentProof[0] ?? null;
    const canEdit = receipt.status === "DRAFT";

    const previewData = {
        receiptNo: receipt.receiptNo,
        issueDate: receipt.issueDate.toISOString(),
        paymentDate: receipt.paymentDate?.toISOString() ?? null,
        paymentMethod: receipt.paymentMethod,
        description: receipt.description,
        status: receipt.status,
        partner: {
            name: receipt.partner.name,
            type: receipt.partner.type,
            email: receipt.partner.email,
            bankName: receipt.partner.bankName,
            bankAccount: receipt.partner.bankAccount,
        },
        lineItems: receipt.lineItems.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
            totalPrice: Number(li.totalPrice),
        })),
        totalAmount: Number(receipt.totalAmount),
        notes: receipt.notes,
        proofUrl: proof ? `/uploads/payment-proofs/${proof.filename}` : null,
        proofMimeType: proof?.mimeType ?? null,
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Link href="/payment-receipts"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Kembali ke Payment Receipts
            </Link>

            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900">{receipt.receiptNo}</h1>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[receipt.status]}`}>
                            {receipt.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400">Dibuat oleh {receipt.createdBy.name}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {canEdit && (
                        <Link href={`/payment-receipts/${id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                        </Link>
                    )}
                    <DownloadReceiptButton receiptId={id} receiptNo={receipt.receiptNo} />
                    {transitions.map((t) => (
                        <form key={t.next} action={async () => {
                            "use server";
                            await updateReceiptStatus(id, t.next as any);
                        }}>
                            <button type="submit"
                                className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${t.style}`}>
                                {t.label}
                            </button>
                        </form>
                    ))}
                </div>
            </div>

            {/* Upload bukti pembayaran — kalau belum ada & masih bisa diedit */}
            {!proof && canEdit && (
                <div className="mb-6 bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Bukti Pembayaran</h3>
                    <ProofUploader receiptId={id} existingProof={null} />
                </div>
            )}

            {/* Kalau sudah ada proof tapi masih DRAFT — tetap bisa ganti/hapus dari sini juga */}
            {proof && canEdit && (
                <div className="mb-6 bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Bukti Pembayaran</h3>
                    <ProofUploader
                        receiptId={id}
                        existingProof={{
                            id: proof.id,
                            url: `/uploads/payment-proofs/${proof.filename}`,
                            mimeType: proof.mimeType,
                            originalName: proof.originalName,
                        }}
                    />
                </div>
            )}

            <PaymentReceiptPreview data={previewData} />

            {receipt.status === "DRAFT" && (
                <div className="mt-4 flex justify-end">
                    <form action={async () => {
                        "use server";
                        await deletePaymentReceipt(id);
                    }}>
                        <button type="submit" className="text-sm text-red-400 hover:text-red-600 transition-colors">
                            Hapus dokumen ini
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}