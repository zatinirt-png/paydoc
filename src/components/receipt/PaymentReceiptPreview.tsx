// src/components/receipt/PaymentReceiptPreview.tsx
// Preview komponen untuk Bukti Pembayaran / Payment Receipt
// Dipakai di: create, detail, edit, dan PDF

import { COMPANY } from "@/lib/company";
import { formatIDR, formatDate } from "@/lib/utils";

export type ReceiptPreviewData = {
    receiptNo: string;
    issueDate: string;
    paymentDate?: string | null;
    paymentMethod?: string | null;
    description: string;
    status?: string;
    partner: {
        name: string;
        type?: string;
        bankName?: string | null;
        bankAccount?: string | null;
        address?: string | null;
        email?: string | null;
    };
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    totalAmount: number;
    notes?: string | null;
    // ── Bukti pembayaran (foto/PDF) ──
    proofUrl?: string | null;
    proofMimeType?: string | null;
};

const PARTNER_TYPE_LABEL: Record<string, string> = {
    FREELANCER: "Freelancer",
    VENDOR: "Vendor",
    INTERNAL: "Internal",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    transfer: "Transfer Bank",
    cash: "Tunai",
    ewallet: "E-Wallet",
    cheque: "Cek",
};

export default function PaymentReceiptPreview({
    data,
    printMode = false,
}: {
    data: ReceiptPreviewData;
    printMode?: boolean;
}) {
    const base = printMode
        ? "bg-white font-sans text-gray-900"
        : "bg-white rounded-xl shadow-sm border border-gray-100 font-sans";

    const isImageProof = data.proofUrl && data.proofMimeType?.startsWith("image/");
    const isPdfProof = data.proofUrl && data.proofMimeType === "application/pdf";

    return (
        <div className={`${base} p-8`} id="receipt-preview">

            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <div className="w-12 h-12 bg-[#1a1f5e] rounded-xl flex items-center justify-center text-white font-black text-base mb-3 select-none">
                        {COMPANY.initials}
                    </div>
                    <p className="font-black text-gray-900 text-sm tracking-wide uppercase">{COMPANY.name}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed whitespace-pre-line">{COMPANY.address}</p>
                </div>

                <div className="text-right">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Bukti Pembayaran</h2>
                    <p className="text-sm font-semibold text-gray-400 mt-1">#{data.receiptNo}</p>
                    <div className="mt-2 space-y-0.5">
                        <p className="text-xs text-gray-400">Tanggal: {data.issueDate ? formatDate(data.issueDate) : "—"}</p>
                        {data.paymentDate && <p className="text-xs text-gray-400">Tgl. Bayar: {formatDate(data.paymentDate)}</p>}
                        {data.paymentMethod && (
                            <p className="text-xs font-semibold text-[#1a1f5e] mt-1">
                                {PAYMENT_METHOD_LABEL[data.paymentMethod] ?? data.paymentMethod}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-900 mb-6" />

            {/* ── Kepada + Total ── */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Kepada / Penerima</p>
                    {data.partner.name ? (
                        <>
                            <p className="font-bold text-gray-900">{data.partner.name}</p>
                            {data.partner.type && (
                                <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1a1f5e]/8 text-[#1a1f5e]">
                                    {PARTNER_TYPE_LABEL[data.partner.type] ?? data.partner.type}
                                </span>
                            )}
                            {data.partner.email && <p className="text-xs text-gray-400 mt-1">{data.partner.email}</p>}
                            {data.partner.bankName && data.partner.bankAccount && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{data.partner.bankName}</span>
                                    <span className="text-xs font-bold text-gray-700 tracking-wider">{data.partner.bankAccount}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-300 italic">Pilih partner...</p>
                    )}
                </div>

                <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Dibayar</p>
                    <p className="text-3xl font-black text-[#1a1f5e]">{formatIDR(data.totalAmount)}</p>
                </div>
            </div>

            {/* ── Deskripsi pembayaran ── */}
            {data.description && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Keterangan</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{data.description}</p>
                </div>
            )}

            {/* ── Rincian / Line Items ── */}
            <table className="w-full mb-6">
                <thead>
                    <tr className="border-b-2 border-gray-900">
                        <th className="text-left pb-2 text-xs font-bold text-gray-700 uppercase tracking-wider">Rincian</th>
                        <th className="text-center pb-2 text-xs font-bold text-gray-700 uppercase tracking-wider w-14">Qty</th>
                        <th className="text-right pb-2 text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Harga</th>
                        <th className="text-right pb-2 text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.lineItems.filter((i) => i.description).length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-300 italic">Tambah rincian...</td></tr>
                    ) : (
                        data.lineItems.filter((i) => i.description).map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-50">
                                <td className="py-3 text-sm font-medium text-gray-800">{item.description}</td>
                                <td className="py-3 text-sm text-center text-gray-500">{item.quantity}</td>
                                <td className="py-3 text-sm text-right text-gray-500">{formatIDR(item.unitPrice)}</td>
                                <td className="py-3 text-sm text-right font-semibold text-gray-800">{formatIDR(item.totalPrice)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* ── Total ── */}
            <div className="flex justify-end mb-8">
                <div className="w-56">
                    <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t-2 border-gray-900">
                        <span>Total</span>
                        <span className="text-[#1a1f5e]">{formatIDR(data.totalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* ── Bukti Transfer (Foto) ── */}
            {(isImageProof || isPdfProof) && (
                <div className="mb-8">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Bukti Transfer
                    </p>
                    {isImageProof ? (
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                            <img
                                src={data.proofUrl!}
                                alt="Bukti transfer pembayaran"
                                className="w-full max-h-[420px] object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-600">Bukti transfer (PDF) terlampir</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tanda Tangan ── */}
            <div className="grid grid-cols-2 gap-8 mb-8 pt-4">
                <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Yang Membayar</p>
                    <div className="h-20" />
                    <div className="border-t border-gray-300 pt-2">
                        <p className="text-sm font-bold text-gray-700">{COMPANY.name}</p>
                        <p className="text-xs text-gray-400">Tanggal: {data.issueDate ? formatDate(data.issueDate) : "—"}</p>
                    </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Yang Menerima</p>
                    <div className="h-20" />
                    <div className="border-t border-gray-300 pt-2">
                        <p className="text-sm font-bold text-gray-700">{data.partner.name || "—"}</p>
                        <p className="text-xs text-gray-400">
                            Tanggal: {data.paymentDate ? formatDate(data.paymentDate) : "—"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Notes ── */}
            {data.notes && (
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Catatan</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{data.notes}</p>
                </div>
            )}

            {/* ── Footer ── */}
            <div className="mt-8 pt-4 border-t border-gray-50 text-center">
                <p className="text-xs text-gray-300">Generated by {COMPANY.name} · PayDoc</p>
            </div>
        </div>
    );
}