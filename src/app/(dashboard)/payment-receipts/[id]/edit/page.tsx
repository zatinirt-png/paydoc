// src/app/(dashboard)/payment-receipts/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { getPaymentReceiptById } from "@/actions/payment-receipt.actions";
import { getPartners } from "@/actions/partner.actions";
import EditReceiptForm from "./EditReceiptForm";

export default async function EditReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [receipt, partners] = await Promise.all([getPaymentReceiptById(id), getPartners()]);

    if (!receipt) notFound();

    if (receipt.status !== "DRAFT") {
    return (
    <div className="max-w-md mx-auto mt-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Tidak bisa diedit</h2>
        <p className="text-gray-400 text-sm">
            Dokumen berstatus <strong>{receipt.status}</strong> tidak bisa diubah.
        </p>
        <a href={`/payment-receipts/${id}`}
            className="mt-6 inline-block px-5 py-2.5 bg-[#1a1f5e] text-white text-sm font-semibold rounded-xl">
            Kembali
        </a>
    </div>
    );
    }

    return
    <EditReceiptForm receipt={receipt} partners={partners} />;
    }
