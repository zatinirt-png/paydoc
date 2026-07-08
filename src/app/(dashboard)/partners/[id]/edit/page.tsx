// src/app/(dashboard)/partners/[id]/edit/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPartnerById, updatePartner } from "@/actions/partner.actions";
import PartnerForm from "../../PartnerForm";
import type { ActionResult } from "@/lib/utils";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await getPartnerById(id);
  if (!partner) notFound();

  async function updateAndRedirect(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
    "use server";
    const result = await updatePartner(id, formData);
    if (result.success) redirect("/partners");
    return result;
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/partners" className="hover:text-gray-600">Partners</Link>
        <span>/</span><span className="text-gray-700 font-medium">Edit — {partner.name}</span>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Partner</h2>
      </div>
      <PartnerForm action={updateAndRedirect} defaultValues={{
        name: partner.name, type: partner.type,
        email: partner.email ?? "", phone: partner.phone ?? "",
        bankName: partner.bankName ?? "", bankAccount: partner.bankAccount ?? "",
        taxId: partner.taxId ?? "", notes: partner.notes ?? "",
      }} submitLabel="Simpan Perubahan" />
    </div>
  );
}