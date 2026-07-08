// src/app/(dashboard)/clients/DeleteClientButton.tsx
"use client";

import { useTransition } from "react";
import { deleteClient } from "@/actions/client.actions";

type Props = {
  id: string;
  name: string;
  invoiceCount: number;
};

export default function DeleteClientButton({ id, name, invoiceCount }: Props) {
  const [isPending, startTransition] = useTransition();

  const hasInvoices = invoiceCount > 0;

  function handleDelete() {
    if (hasInvoices) return;
    if (!confirm(`Hapus klien "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    startTransition(async () => {
      const result = await deleteClient(id);
      if (!result.success) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending || hasInvoices}
      title={hasInvoices ? "Tidak bisa dihapus — klien masih memiliki invoice" : "Hapus klien"}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
        hasInvoices
          ? "text-gray-300 border-gray-100 cursor-not-allowed"
          : "text-red-400 border-red-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
      }`}
    >
      {isPending ? "..." : "Hapus"}
    </button>
  );
}