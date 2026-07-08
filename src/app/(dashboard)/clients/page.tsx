// src/app/(dashboard)/clients/page.tsx
import Link from "next/link";
import { getClientsWithStats } from "@/actions/client.actions";
import { formatDate } from "@/lib/utils";
import DeleteClientButton from "./DeleteClientButton";

export default async function ClientsPage() {
  const clients = await getClientsWithStats();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} klien terdaftar</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a1f5e] hover:bg-[#252b7a] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Client
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {clients.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-3 text-gray-200" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-gray-400 text-sm font-medium">Belum ada klien</p>
            <Link href="/clients/new" className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#1a1f5e] hover:underline font-semibold">
              Tambah klien pertama →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-50">
              <tr>
                {["Nama", "Email", "Telepon", "Invoice", "Bergabung", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a1f5e]/10 flex items-center justify-center text-xs font-bold text-[#1a1f5e] flex-shrink-0 select-none">
                        {client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{client.name}</p>
                        {client.taxId && <p className="text-xs text-gray-400">NPWP: {client.taxId}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{client.email ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{client.phone ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      {client._count.invoices} invoice
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">{formatDate(client.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/clients/${client.id}/edit`}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteClientButton id={client.id} name={client.name} invoiceCount={client._count.invoices} />
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