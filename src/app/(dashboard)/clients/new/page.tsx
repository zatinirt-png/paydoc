// src/app/(dashboard)/clients/new/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/actions/client.actions";
import ClientForm from "../ClientForm";
import type { ActionResult } from "@/lib/utils";

// Wrapper action yang redirect setelah sukses
async function createClientAndRedirect(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";

  const result = await createClient(formData);

  if (result.success) {
    redirect("/clients");
  }

  return result;
}

export default function NewClientPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/clients" className="hover:text-gray-600 transition-colors">
          Clients
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Tambah Baru</span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tambah Klien</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Klien adalah penerima invoice yang kamu buat.
        </p>
      </div>

      <ClientForm
        action={createClientAndRedirect}
        submitLabel="Tambah Klien"
        cancelHref="/clients"
      />
    </div>
  );
}