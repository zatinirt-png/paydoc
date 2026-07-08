// src/app/(dashboard)/payment-receipts/new/page.tsx
import { getPartners } from "@/actions/partner.actions";
import NewReceiptForm from "./NewReceiptForm";

export default async function NewReceiptPage() {
  const partners = await getPartners();
  return <NewReceiptForm partners={partners} />;
}