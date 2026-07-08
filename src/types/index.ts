export type Role = "ADMIN" | "STAFF";
export type PartnerType = "FREELANCER" | "VENDOR" | "INTERNAL";
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentReceiptStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

export type SessionUser = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};

export type LineItem = {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  order: number;
};