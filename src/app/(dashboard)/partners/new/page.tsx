// src/app/(dashboard)/partners/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createPartner } from "@/actions/partner.actions";
import PartnerForm from "../PartnerForm";
import type { ActionResult } from "@/lib/utils";

async function createAndRedirect(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  "use server";
  const result = await createPartner(formData);
  if (result.success) redirect("/partners");
  return result;
}

export default function NewPartnerPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/partners" className="hover:text-gray-600">Partners</Link>
        <span>/</span><span className="text-gray-700 font-medium">Tambah Baru</span>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tambah Partner</h2>
        <p className="text-sm text-gray-400 mt-0.5">Freelancer, vendor, atau anggota internal.</p>
      </div>
      <PartnerForm action={createAndRedirect} submitLabel="Tambah Partner" />
    </div>
  );
}