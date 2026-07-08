// src/actions/invoice.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generateDocNumber } from "@/lib/utils";
import type { ActionResult } from "@/lib/utils";

const LineItemSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  qty: z.number().positive("Qty harus > 0"),
  unitPrice: z.number().min(0),
  unit: z.string().optional(),
});

const InvoiceSchema = z.object({
  clientId: z.string().min(1, "Pilih klien terlebih dahulu"),
  projectId: z.string().optional(),
  issueDate: z.string().min(1, "Issue date wajib diisi"),
  dueDate: z.string().optional(),
  currency: z.string().default("IDR"),
  taxPercent: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(LineItemSchema).min(1, "Minimal 1 line item"),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;

async function generateInvoiceNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { invoiceNo: { startsWith: `INV-${year}` } },
  });
  return generateDocNumber("INV", count + 1);
}

function calcTotals(items: InvoiceInput["lineItems"], taxPercent: number) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const taxAmount = subtotal * (taxPercent / 100);
  return { subtotal, taxAmount, totalAmount: subtotal + taxAmount };
}

// ── CREATE ───────────────────────────────────

export async function createInvoice(
  input: InvoiceInput,
): Promise<ActionResult<{ id: string; invoiceNo: string }>> {
  try {
    const session = await requireSession();
    const parsed = InvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validasi gagal.",
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const {
      clientId,
      projectId,
      issueDate,
      dueDate,
      currency,
      taxPercent,
      notes,
      terms,
      lineItems,
    } = parsed.data;
    const { subtotal, taxAmount, totalAmount } = calcTotals(
      lineItems,
      taxPercent,
    );
    const invoiceNo = await generateInvoiceNo();

    const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          issueDate: new Date(issueDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          status: "DRAFT",
          currency,
          subtotal,
          taxPercent,
          taxAmount,
          totalAmount,
          notes: notes ?? null,
          terms: terms ?? null,
          clientId,
          projectId: projectId ?? null,
          createdById: session.sub,
        },
      });

      await tx.invoiceLineItem.createMany({
        data: lineItems.map((item, idx) => ({
          invoiceId: inv.id,
          description: item.description,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          totalPrice: item.qty * item.unitPrice,
          unit: item.unit ?? null,
          order: idx,
        })),
      });

      return inv;
    });

    revalidatePath("/invoices");
    revalidatePath("/");
    return {
      success: true,
      data: { id: invoice.id, invoiceNo: invoice.invoiceNo },
    };
  } catch (err) {
    console.error("[createInvoice]", err);
    return { success: false, error: "Gagal menyimpan invoice." };
  }
}

// ── UPDATE ───────────────────────────────────

export async function updateInvoice(
  invoiceId: string,
  input: InvoiceInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
    const parsed = InvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validasi gagal.",
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { status: true },
    });
    if (!existing) return { success: false, error: "Invoice tidak ditemukan." };
    if (existing.status !== "DRAFT")
      return { success: false, error: "Hanya invoice DRAFT yang bisa diedit." };

    const {
      clientId,
      projectId,
      issueDate,
      dueDate,
      currency,
      taxPercent,
      notes,
      terms,
      lineItems,
    } = parsed.data;
    const { subtotal, taxAmount, totalAmount } = calcTotals(
      lineItems,
      taxPercent,
    );

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId } });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          issueDate: new Date(issueDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          currency,
          subtotal,
          taxPercent,
          taxAmount,
          totalAmount,
          notes: notes ?? null,
          terms: terms ?? null,
          clientId,
          projectId: projectId ?? null,
        },
      });

      await tx.invoiceLineItem.createMany({
        data: lineItems.map((item, idx) => ({
          invoiceId,
          description: item.description,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          totalPrice: item.qty * item.unitPrice,
          unit: item.unit ?? null,
          order: idx,
        })),
      });
    });

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/");
    return { success: true, data: { id: invoiceId } };
  } catch (err) {
    console.error("[updateInvoice]", err);
    return { success: false, error: "Gagal mengupdate invoice." };
  }
}

// ── UPDATE STATUS ─────────────────────────────

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED",
): Promise<ActionResult> {
  try {
    await requireSession();
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Gagal update status." };
  }
}

// ── DELETE ────────────────────────────────────

export async function deleteInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    await requireSession();
    const inv = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { status: true },
    });
    if (!inv) return { success: false, error: "Invoice tidak ditemukan." };
    if (inv.status !== "DRAFT")
      return { success: false, error: "Hanya DRAFT yang bisa dihapus." };
    await prisma.invoice.delete({ where: { id: invoiceId } });
    revalidatePath("/invoices");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Gagal menghapus invoice." };
  }
}

// ── QUERIES ───────────────────────────────────

export async function getInvoices(filters?: {
  status?: InvoiceStatus;
  clientId?: string;
}) {
  return prisma.invoice.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
    },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { lineItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: { select: { name: true } },
      createdBy: { select: { name: true } },
      lineItems: { orderBy: { order: "asc" } },
      paymentProof: true,
    },
  });
}
