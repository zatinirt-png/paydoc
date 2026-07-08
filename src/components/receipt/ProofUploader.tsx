// src/components/receipt/ProofUploader.tsx
"use client";

import { useState, useTransition, useRef } from "react";
import { uploadPaymentProof, deletePaymentProof } from "@/actions/upload.actions";

type ExistingProof = {
    id: string;
    url: string;
    mimeType: string;
    originalName: string;
} | null;

type Props = {
    // Salah satu wajib diisi
    receiptId?: string;
    invoiceId?: string;
    existingProof: ExistingProof;
    // Untuk flow "New" — file dipilih dulu, upload terjadi setelah dokumen tersimpan
    deferred?: boolean;
    onFileSelected?: (file: File | null) => void;
    readOnly?: boolean;
};

export default function ProofUploader({
    receiptId,
    invoiceId,
    existingProof,
    deferred = false,
    onFileSelected,
    readOnly = false,
}: Props) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [localPreview, setLocalPreview] = useState<{ url: string; type: string; name: string } | null>(null);
    const [uploaded, setUploaded] = useState<ExistingProof>(existingProof);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowed.includes(file.type)) {
            setError("Format harus JPG, PNG, WEBP, atau PDF.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Ukuran file maksimal 5MB.");
            return;
        }

        // Mode deferred (form New) — simpan File di parent, preview lokal saja
        if (deferred) {
            const objectUrl = URL.createObjectURL(file);
            setLocalPreview({ url: objectUrl, type: file.type, name: file.name });
            onFileSelected?.(file);
            return;
        }

        // Mode langsung — upload sekarang juga
        const formData = new FormData();
        formData.append("file", file);
        if (receiptId) formData.append("receiptId", receiptId);
        if (invoiceId) formData.append("invoiceId", invoiceId);

        startTransition(async () => {
            const result = await uploadPaymentProof(formData);
            if (!result.success) {
                setError(result.error);
                return;
            }
            setUploaded({
                id: result.data.id,
                url: result.data.url,
                mimeType: result.data.mimeType,
                originalName: file.name,
            });
        });
    }

    function handleRemove() {
        if (deferred) {
            setLocalPreview(null);
            onFileSelected?.(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        if (!uploaded) return;
        if (!confirm("Hapus bukti pembayaran ini?")) return;

        startTransition(async () => {
            const result = await deletePaymentProof(uploaded.id);
            if (!result.success) {
                setError(result.error);
                return;
            }
            setUploaded(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        });
    }

    const displayed = deferred ? localPreview : (uploaded
        ? { url: uploaded.url, type: uploaded.mimeType, name: uploaded.originalName }
        : null);

    return (
        <div>
            {error && (
                <div className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                    {error}
                </div>
            )}

            {displayed ? (
                // ── Preview yang sudah ada ──
                <div className="relative group">
                    {displayed.type === "application/pdf" ? (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{displayed.name}</p>
                                <p className="text-xs text-gray-400">File PDF</p>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    disabled={isPending}
                                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200">
                            <img
                                src={displayed.url}
                                alt="Bukti pembayaran"
                                className="w-full max-h-72 object-contain bg-gray-50"
                            />
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    disabled={isPending}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                                    title="Hapus"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {!readOnly && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPending}
                            className="mt-2 text-xs text-[#1a1f5e] hover:underline font-medium"
                        >
                            Ganti file
                        </button>
                    )}
                </div>
            ) : (
                // ── Empty state — upload area ──
                !readOnly && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending}
                        className="w-full border-2 border-dashed border-gray-200 hover:border-[#1a1f5e]/30 rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-colors group"
                    >
                        {isPending ? (
                            <>
                                <svg className="animate-spin w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                <p className="text-xs text-gray-400">Mengunggah...</p>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-[#1a1f5e]/5 flex items-center justify-center transition-colors">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-[#1a1f5e]/60">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <p className="text-xs font-medium text-gray-500">Klik untuk upload foto bukti transfer</p>
                                <p className="text-[10px] text-gray-300">JPG, PNG, WEBP, atau PDF · Maks 5MB</p>
                            </>
                        )}
                    </button>
                )
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}