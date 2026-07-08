// src/app/(dashboard)/invoices/new/page.tsx
// Server Component wrapper — fetch clients dari DB, lalu render form (Client Component)

import { getClients } from "@/actions/client.actions";
import NewInvoiceForm from "./NewInvoiceForm";

export default async function NewInvoicePage() {
  const clients = await getClients();
  return <NewInvoiceForm clients={clients} />;
}