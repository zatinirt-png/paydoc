// src/app/(dashboard)/partners/page.tsx
import Link from "next/link";
import { getPartnersWithStats } from "@/actions/partner.actions";
import { formatDate } from "@/lib/utils";
import DeletePartnerButton from "./DeletePartnerButton";

const TYPE_STYLE: Record<string, string> = {
    FREELANCER: "bg-purple-50 text-purple-600",
    VENDOR: "bg-blue-50 text-blue-600",
    INTERNAL: "bg-green-50 text-green-600",
    };

    export default async function PartnersPage() {
    const partners = await getPartnersWithStats();

    return (
    <div>
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Partners</h2>
                <p className="text-sm text-gray-400 mt-0.5">{partners.length} partner terdaftar</p>
            </div>
            <Link href="/partners/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a1f5e] hover:bg-[#252b7a] text-white text-sm font-semibold rounded-xl transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Partner
            </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {partners.length === 0 ? (
            <div className="py-16 text-center">
                <svg className="mx-auto mb-3 text-gray-200" width="48" height="48" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p className="text-gray-400 text-sm font-medium">Belum ada partner</p>
                <Link href="/partners/new"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#1a1f5e] hover:underline font-semibold">
                Tambah partner pertama →
                </Link>
            </div>
            ) : (
            <table className="w-full">
                <thead className="border-b border-gray-50">
                    <tr>
                        {["Nama", "Tipe", "Bank / Rekening", "Dokumen", "Bergabung", ""].map((h) => (
                        <th key={h}
                            className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {partners.map((p) => (
                    <tr key={p.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full bg-[#1a1f5e]/10 flex items-center justify-center text-xs font-bold text-[#1a1f5e] flex-shrink-0 select-none">
                                    {p.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                                    {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                                </div>
                            </div>
                        </td>
                        <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                ${TYPE_STYLE[p.type] ?? "bg-gray-100 text-gray-500" }`}>
                                {p.type}
                            </span>
                        </td>
                        <td className="px-5 py-4">
                            {p.bankName && p.bankAccount ? (
                            <div>
                                <p className="text-xs text-gray-500">{p.bankName}</p>
                                <p className="text-xs font-bold text-gray-700 tracking-wider">{p.bankAccount}</p>
                            </div>
                            ) : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                        <td className="px-5 py-4">
                            <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                                {p._count.paymentReceipts} receipt
                            </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">{formatDate(p.createdAt)}</td>
                        <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                                <Link href={`/partners/${p.id}/edit`}
                                    className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors">
                                Edit
                                </Link>
                                <DeletePartnerButton id={p.id} name={p.name} receiptCount={p._count.paymentReceipts} />
                            </div>
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
