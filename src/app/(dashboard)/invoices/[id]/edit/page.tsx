// src/app/(dashboard)/invoices/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/actions/invoice.actions";
import { getClients } from "@/actions/client.actions";
import EditInvoiceForm from "./EditInvoiceForm";

export default async function EditInvoicePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [invoice, clients] = await Promise.all([
        getInvoiceById(id),
        getClients(),
    ]);

    if (!invoice) notFound();

    // Hanya DRAFT yang bisa diedit
    if (invoice.status !== "DRAFT") {
        return (
            <div className="max-w-md mx-auto mt-20 text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Tidak bisa diedit</h2>
                <p className="text-gray-400 text-sm">
                    Invoice berstatus <strong>{invoice.status}</strong> tidak bisa diubah.
                    Hanya invoice DRAFT yang bisa diedit.
                </p>
                <a
                    href={`/invoices/${id}`}
                    className="mt-6 inline-block px-5 py-2.5 bg-[#1a1f5e] text-white text-sm font-semibold rounded-xl"
                >
                    Kembali ke Invoice
                </a>
            </div>
        );
    }

    return (
        <EditInvoiceForm
            invoice={invoice}
            clients={clients}
        />
    );
}