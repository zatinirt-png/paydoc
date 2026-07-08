// src/app/(dashboard)/partners/DeletePartnerButton.tsx
"use client";
import { useTransition } from "react";
import { deletePartner } from "@/actions/partner.actions";

export default function DeletePartnerButton({ id, name, receiptCount }: { id: string; name: string; receiptCount: number }) {
  const [isPending, startTransition] = useTransition();
  const hasReceipts = receiptCount > 0;

  function handleDelete() {
    if (hasReceipts) return;
    if (!confirm(`Hapus partner "${name}"?`)) return;
    startTransition(async () => {
      const result = await deletePartner(id);
      if (!result.success) alert(result.error);
    });
  }

  return (
    <button onClick={handleDelete} disabled={isPending || hasReceipts}
      title={hasReceipts ? "Masih memiliki payment receipt" : "Hapus"}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
        hasReceipts ? "text-gray-300 border-gray-100 cursor-not-allowed"
          : "text-red-400 border-red-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200"}`}>
      {isPending ? "..." : "Hapus"}
    </button>
  );
}