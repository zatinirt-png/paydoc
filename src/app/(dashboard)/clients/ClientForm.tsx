// src/app/(dashboard)/clients/ClientForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ActionResult } from "@/lib/utils";

type Props = {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    notes?: string;
  };
  submitLabel?: string;
  cancelHref?: string;
};

const initialState: ActionResult = { success: false, error: "" };

const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]/40 transition-all";

export default function ClientForm({
  action,
  defaultValues = {},
  submitLabel = "Simpan",
  cancelHref = "/clients",
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const fe = (!state.success && state.fields) ? state.fields : {};

  return (
    <form action={formAction} className="space-y-5 max-w-xl">
      {/* Global error */}
      {!state.success && state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {state.error}
        </div>
      )}

      {/* Success */}
      {state.success && state.message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {state.message}
        </div>
      )}

      {/* Name */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Informasi Utama</h3>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Nama Klien <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            className={`${inputCls} ${fe.name ? "border-red-300" : ""}`}
            placeholder="PT. Nama Perusahaan / Nama Individu"
            defaultValue={defaultValues.name ?? ""}
          />
          {fe.name && <p className="text-red-500 text-xs mt-1">{fe.name[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              className={`${inputCls} ${fe.email ? "border-red-300" : ""}`}
              placeholder="billing@klien.com"
              defaultValue={defaultValues.email ?? ""}
            />
            {fe.email && <p className="text-red-500 text-xs mt-1">{fe.email[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Telepon
            </label>
            <input
              name="phone"
              type="tel"
              className={inputCls}
              placeholder="08xxxxxxxxxx"
              defaultValue={defaultValues.phone ?? ""}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            NPWP / Tax ID
          </label>
          <input
            name="taxId"
            className={inputCls}
            placeholder="00.000.000.0-000.000"
            defaultValue={defaultValues.taxId ?? ""}
          />
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Alamat</h3>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Alamat Lengkap
          </label>
          <textarea
            name="address"
            rows={3}
            className={inputCls}
            placeholder={"Jl. Contoh No. 1\nJakarta, 10110"}
            defaultValue={defaultValues.address ?? ""}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Catatan Internal</h3>
        <textarea
          name="notes"
          rows={3}
          className={inputCls}
          placeholder="Catatan khusus tentang klien ini..."
          defaultValue={defaultValues.notes ?? ""}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 sm:flex-none sm:px-8 py-3 bg-[#1a1f5e] hover:bg-[#252b7a] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Menyimpan...
            </span>
          ) : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm rounded-xl transition-colors text-center"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}