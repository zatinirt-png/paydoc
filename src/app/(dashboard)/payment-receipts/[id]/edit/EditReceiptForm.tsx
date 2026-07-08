// src/app/(dashboard)/payment-receipts/[id]/edit/EditReceiptForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updatePaymentReceipt } from "@/actions/payment-receipt.actions";
import PaymentReceiptPreview from "@/components/receipt/PaymentReceiptPreview";
import ProofUploader from "@/components/receipt/ProofUploader";
import { formatIDR } from "@/lib/utils";

type Partner = { id: string; name: string; type: string; email: string | null; bankName: string | null; bankAccount: string | null };
type LineItem = { id: string; description: string; qty: number; unitPrice: number };

function uid() { return Math.random().toString(36).slice(2, 9); }

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all";

const PAYMENT_METHODS = [
    { value: "transfer", label: "Transfer Bank" },
    { value: "cash", label: "Tunai" },
    { value: "ewallet", label: "E-Wallet" },
    { value: "cheque", label: "Cek" },
];

export default function EditReceiptForm({ receipt, partners }: { receipt: any; partners: Partner[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const [selectedPartnerId, setSelectedPartnerId] = useState(receipt.partnerId);
    const [issueDate, setIssueDate] = useState(new Date(receipt.issueDate).toISOString().split("T")[0]);
    const [paymentDate, setPaymentDate] = useState(receipt.paymentDate ? new Date(receipt.paymentDate).toISOString().split("T")[0] : "");
    const [paymentMethod, setPaymentMethod] = useState(receipt.paymentMethod ?? "transfer");
    const [description, setDescription] = useState(receipt.description);
    const [notes, setNotes] = useState(receipt.notes ?? "");
    const [items, setItems] = useState<LineItem[]>(
        receipt.lineItems.length > 0
            ? receipt.lineItems.map((li: any) => ({ id: li.id, description: li.description, qty: Number(li.quantity), unitPrice: Number(li.unitPrice) }))
            : [{ id: uid(), description: "", qty: 1, unitPrice: 0 }]
    );

    const selectedPartner = partners.find((p) => p.id === selectedPartnerId) ?? null;
    const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

    function addItem() { setItems((p) => [...p, { id: uid(), description: "", qty: 1, unitPrice: 0 }]); }
    function removeItem(id: string) { setItems((p) => p.filter((i) => i.id !== id)); }
    function updateItem(id: string, field: keyof LineItem, value: string | number) {
        setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    }

    function handleSave() {
        setError(null); setFieldErrors({});
        startTransition(async () => {
            const result = await updatePaymentReceipt(receipt.id, {
                partnerId: selectedPartnerId,
                issueDate,
                paymentDate: paymentDate || undefined,
                paymentMethod: paymentMethod || undefined,
                description,
                notes: notes || undefined,
                currency: "IDR",
                lineItems: items.map((i) => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice })),
            });
            if (!result.success) {
                setError(result.error);
                if (result.fields) setFieldErrors(result.fields);
                return;
            }
            router.push(`/payment-receipts/${receipt.id}`);
        });
    }

    const previewData = {
        receiptNo: receipt.receiptNo,
        issueDate, paymentDate: paymentDate || null, paymentMethod: paymentMethod || null, description,
        partner: { name: selectedPartner?.name ?? "", type: selectedPartner?.type, email: selectedPartner?.email, bankName: selectedPartner?.bankName, bankAccount: selectedPartner?.bankAccount },
        lineItems: items.map((i) => ({ description: i.description, quantity: i.qty, unitPrice: i.unitPrice, totalPrice: i.qty * i.unitPrice })),
        totalAmount: total, notes: notes || null,
        proofUrl: receipt.paymentProof?.[0] ? `/uploads/payment-proofs/${receipt.paymentProof[0].filename}` : null,
        proofMimeType: receipt.paymentProof?.[0]?.mimeType ?? null,
    };

    return (
        <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
            <div className="w-[440px] flex-shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <Link href={`/payment-receipts/${receipt.id}`} className="hover:text-gray-600">{receipt.receiptNo}</Link>
                            <span>/</span><span className="text-gray-700 font-medium">Edit</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#1a1f5e]">Edit Bukti Pembayaran</h1>
                    </div>
                    <span className="text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-full">DRAFT</span>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {/* Partner */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Partner / Penerima</label>
                        <select value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)} className={inputCls}>
                            <option value="">Pilih partner...</option>
                            {partners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                        </select>
                        {selectedPartner && (
                            <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-0.5">
                                <p className="text-xs font-semibold text-[#1a1f5e]">{selectedPartner.name}</p>
                                {selectedPartner.bankName && <p className="text-xs text-gray-400">{selectedPartner.bankName}</p>}
                                {selectedPartner.bankAccount && <p className="text-xs font-bold text-gray-700 tracking-wider">{selectedPartner.bankAccount}</p>}
                            </div>
                        )}
                    </div>

                    {/* Tanggal & Metode */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal Dokumen</label>
                                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal Bayar</label>
                                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Metode Pembayaran</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Keterangan</label>
                        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                            className={`${inputCls} resize-none`} />
                    </div>

                    {/* Rincian */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">Rincian</h3>
                            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm text-[#1a1f5e] hover:text-[#252b7a] font-medium transition-colors">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                Tambah
                            </button>
                        </div>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="bg-gray-50 rounded-lg p-3.5 space-y-2.5">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Deskripsi</label>
                                            <input className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-sm bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all"
                                                value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} />
                                        </div>
                                        <div className="w-16">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Qty</label>
                                            <input type="number" min={1} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm bg-white text-center focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all"
                                                value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Harga (IDR)</label>
                                            <input type="number" min={0} className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all"
                                                value={item.unitPrice || ""} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} />
                                        </div>
                                        <div className="w-24 text-right text-sm font-semibold text-gray-700 pb-1.5">{formatIDR(item.qty * item.unitPrice)}</div>
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => removeItem(item.id)} className="pb-1.5 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                    <path d="M10 11v6" /><path d="M14 11v6" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-sm font-bold text-gray-900">
                                <span>Total</span><span className="text-[#1a1f5e]">{formatIDR(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bukti Pembayaran */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Bukti Pembayaran (Foto)
                        </label>
                        <ProofUploader
                            receiptId={receipt.id}
                            existingProof={
                                receipt.paymentProof?.[0]
                                    ? {
                                        id: receipt.paymentProof[0].id,
                                        url: `/uploads/payment-proofs/${receipt.paymentProof[0].filename}`,
                                        mimeType: receipt.paymentProof[0].mimeType,
                                        originalName: receipt.paymentProof[0].originalName,
                                    }
                                    : null
                            }
                        />
                    </div>

                    {/* Catatan */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Catatan</label>
                        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="h-4" />
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-3">
                    <button type="button" onClick={handleSave} disabled={isPending}
                        className="flex-1 py-3 bg-[#1a1f5e] hover:bg-[#252b7a] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors">
                        {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                    <Link href={`/payment-receipts/${receipt.id}`}
                        className="px-5 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm rounded-xl transition-colors text-center">
                        Batal
                    </Link>
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">Live Preview</p>
                <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
                    <PaymentReceiptPreview data={previewData} />
                </div>
            </div>
        </div>
    );
}