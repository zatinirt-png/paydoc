// src/app/(dashboard)/clients/[id]/edit/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClientById, updateClient } from "@/actions/client.actions";
import ClientForm from "../../ClientForm";
import type { ActionResult } from "@/lib/utils";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  // Wrapper action — bind id via closure
  async function updateAndRedirect(
    _prev: ActionResult,
    formData: FormData
  ): Promise<ActionResult> {
    "use server";
    const result = await updateClient(id, formData);
    if (result.success) {
      redirect("/clients");
    }
    return result;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/clients" className="hover:text-gray-600 transition-colors">
          Clients
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Edit — {client.name}</span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Klien</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Update informasi klien. Perubahan akan langsung berlaku.
        </p>
      </div>

      <ClientForm
        action={updateAndRedirect}
        defaultValues={{
          name:    client.name,
          email:   client.email   ?? "",
          phone:   client.phone   ?? "",
          address: client.address ?? "",
          taxId:   client.taxId   ?? "",
          notes:   client.notes   ?? "",
        }}
        submitLabel="Simpan Perubahan"
        cancelHref="/clients"
      />

      {/* Invoice history */}
      {client.invoices.length > 0 && (
        <div className="mt-8 max-w-xl">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Invoice Terkait ({client._count.invoices})
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {client.invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{inv.invoiceNo}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(inv.issueDate).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    inv.status === "PAID"      ? "bg-green-100 text-green-600" :
                    inv.status === "SENT"      ? "bg-blue-100 text-blue-600"   :
                    inv.status === "OVERDUE"   ? "bg-red-100 text-red-600"     :
                    inv.status === "CANCELLED" ? "bg-gray-100 text-gray-400"   :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {inv.status}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}