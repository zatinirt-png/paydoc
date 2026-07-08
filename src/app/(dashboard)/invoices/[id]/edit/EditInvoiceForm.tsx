// src/app/(dashboard)/invoices/[id]/edit/EditInvoiceForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateInvoice } from "@/actions/invoice.actions";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { formatIDR } from "@/lib/utils";

type Client = { id: string; name: string; email: string | null; address: string | null; phone: string | null };
type LineItemDB = { id: string; description: string; quantity: unknown; unitPrice: unknown; totalPrice: unknown; unit: string | null; order: number };
type InvoiceDB = {
    id: string; invoiceNo: string; status: string;
    issueDate: Date; dueDate: Date | null;
    clientId: string; taxPercent: unknown; notes: string | null; terms: string | null;
    client: Client;
    lineItems: LineItemDB[];
};

type LineItem = { id: string; description: string; qty: number; unitPrice: number };

function uid() { return Math.random().toString(36).slice(2, 9); }

function calcTotal(items: LineItem[], tax: number) {
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const taxAmount = subtotal * (tax / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
}

const inputCls =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all";

export default function EditInvoiceForm({
    invoice,
    clients,
}: {
    invoice: InvoiceDB;
    clients: Client[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    // Pre-fill state dari data DB
    const [selectedClientId, setSelectedClientId] = useState(invoice.clientId);
    const [issueDate, setIssueDate] = useState(
        new Date(invoice.issueDate).toISOString().split("T")[0]
    );
    const [dueDate, setDueDate] = useState(
        invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : ""
    );
    const [taxPercent, setTaxPercent] = useState(Number(invoice.taxPercent));
    const [notes, setNotes] = useState(invoice.notes ?? "");
    const [terms, setTerms] = useState(invoice.terms ?? "");
    const [items, setItems] = useState<LineItem[]>(
        invoice.lineItems.length > 0
            ? invoice.lineItems.map((li) => ({
                id: li.id,
                description: li.description,
                qty: Number(li.quantity),
                unitPrice: Number(li.unitPrice),
            }))
            : [{ id: uid(), description: "", qty: 1, unitPrice: 0 }]
    );

    const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
    const { subtotal, taxAmount, total } = calcTotal(items, taxPercent);

    // ── Line item handlers ──
    function addItem() {
        setItems((p) => [...p, { id: uid(), description: "", qty: 1, unitPrice: 0 }]);
    }
    function removeItem(id: string) {
        setItems((p) => p.filter((i) => i.id !== id));
    }
    function updateItem(id: string, field: keyof LineItem, value: string | number) {
        setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    }

    // ── Submit ──
    function handleSave() {
        setError(null);
        setFieldErrors({});
        startTransition(async () => {
            const result = await updateInvoice(invoice.id, {
                clientId: selectedClientId,
                issueDate,
                dueDate: dueDate || undefined,
                taxPercent,
                notes: notes || undefined,
                terms: terms || undefined,
                currency: "IDR",
                lineItems: items.map((i) => ({
                    description: i.description,
                    qty: i.qty,
                    unitPrice: i.unitPrice,
                })),
            });

            if (!result.success) {
                setError(result.error);
                if (result.fields) setFieldErrors(result.fields);
                return;
            }
            router.push(`/invoices/${invoice.id}`);
        });
    }

    // Data untuk preview
    const previewData = {
        invoiceNo: invoice.invoiceNo,
        issueDate,
        dueDate,
        client: {
            name: selectedClient?.name ?? "",
            address: selectedClient?.address,
            email: selectedClient?.email,
        },
        lineItems: items.map((i) => ({
            description: i.description,
            quantity: i.qty,
            unitPrice: i.unitPrice,
            totalPrice: i.qty * i.unitPrice,
        })),
        subtotal,
        taxPercent,
        taxAmount,
        totalAmount: total,
        notes: notes || null,
        terms: terms || null,
    };

    return (
        <div className="flex gap-6 min-h-[calc(100vh-8rem)]">

            {/* ── LEFT: Form ── */}
            <div className="w-[440px] flex-shrink-0 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <Link href={`/invoices/${invoice.id}`} className="hover:text-gray-600 transition-colors">
                                {invoice.invoiceNo}
                            </Link>
                            <span>/</span>
                            <span className="text-gray-700 font-medium">Edit</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#1a1f5e]">Edit Invoice</h1>
                    </div>
                    <span className="text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-full">
                        DRAFT
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Form body */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">

                    {/* Client */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Client
                        </label>
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className={`${inputCls} ${fieldErrors.clientId ? "border-red-300" : ""}`}
                        >
                            <option value="">Pilih klien...</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {fieldErrors.clientId && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.clientId[0]}</p>
                        )}
                        {selectedClient && (
                            <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <p className="text-xs font-semibold text-[#1a1f5e]">{selectedClient.name}</p>
                                {selectedClient.email && <p className="text-xs text-gray-400 mt-0.5">{selectedClient.email}</p>}
                                {selectedClient.address && <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-line">{selectedClient.address}</p>}
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Issue Date</label>
                                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Due Date</label>
                                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* Line items */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">Line Items</h3>
                            <button type="button" onClick={addItem}
                                className="flex items-center gap-1.5 text-sm text-[#1a1f5e] hover:text-[#252b7a] font-medium transition-colors">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                Add Item
                            </button>
                        </div>

                        {fieldErrors.lineItems && (
                            <p className="text-red-500 text-xs mb-3">{fieldErrors.lineItems[0]}</p>
                        )}

                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="bg-gray-50 rounded-lg p-3.5 space-y-2.5">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</label>
                                            <input className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-sm bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all"
                                                placeholder="Enter item name..." value={item.description}
                                                onChange={(e) => updateItem(item.id, "description", e.target.value)} />
                                        </div>
                                        <div className="w-16">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Qty</label>
                                            <input type="number" min={1}
                                                className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm bg-white text-center focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all"
                                                value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Unit Price (IDR)</label>
                                            <input type="number" min={0}
                                                className="w-full mt-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-sm bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all"
                                                placeholder="0" value={item.unitPrice || ""}
                                                onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} />
                                        </div>
                                        <div className="w-24 text-right text-sm font-semibold text-gray-700 pb-1.5">
                                            {formatIDR(item.qty * item.unitPrice)}
                                        </div>
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => removeItem(item.id)}
                                                className="pb-1.5 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                    <path d="M10 11v6" /><path d="M14 11v6" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span><span className="font-medium">{formatIDR(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span>Tax</span>
                                    <input type="number" min={0} max={100}
                                        className="w-14 px-2 py-0.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#1a1f5e]/30"
                                        value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
                                    <span>%</span>
                                </div>
                                <span className="font-medium">{formatIDR(taxAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span className="text-[#1a1f5e]">{formatIDR(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes & Terms */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Internal Notes</label>
                            <textarea rows={3} className={inputCls} placeholder="Add notes for your team..."
                                value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Payment Terms</label>
                            <textarea rows={2} className={inputCls} placeholder="e.g. Payment due within 30 days..."
                                value={terms} onChange={(e) => setTerms(e.target.value)} />
                        </div>
                    </div>

                    <div className="h-4" />
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                    <button type="button" onClick={handleSave} disabled={isPending}
                        className="flex-1 py-3 bg-[#1a1f5e] hover:bg-[#252b7a] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors">
                        {isPending ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Menyimpan...
                            </span>
                        ) : "Simpan Perubahan"}
                    </button>
                    <Link href={`/invoices/${invoice.id}`}
                        className="px-5 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm rounded-xl transition-colors text-center">
                        Batal
                    </Link>
                </div>
            </div>

            {/* ── RIGHT: Live preview ── */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                    Live Preview
                </p>
                <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
                    <InvoicePreview data={previewData} />
                </div>
            </div>
        </div>
    );
}