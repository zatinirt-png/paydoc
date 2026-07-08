// src/actions/payment-receipt.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generateDocNumber } from "@/lib/utils";
import type { ActionResult } from "@/lib/utils";

// ── Schema ────────────────────────────────────

const LineItemSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  qty:         z.number().positive("Qty harus > 0"),
  unitPrice:   z.number().min(0),
});

const ReceiptSchema = z.object({
  partnerId:     z.string().min(1, "Pilih partner terlebih dahulu"),
  projectId:     z.string().optional(),
  issueDate:     z.string().min(1, "Tanggal wajib diisi"),
  paymentDate:   z.string().optional(),
  paymentMethod: z.string().optional(),
  currency:      z.string().default("IDR"),
  description:   z.string().min(1, "Deskripsi pembayaran wajib diisi"),
  notes:         z.string().optional(),
  lineItems:     z.array(LineItemSchema).min(1, "Minimal 1 item"),
});

export type ReceiptInput = z.infer<typeof ReceiptSchema>;

// ── Helpers ───────────────────────────────────

async function generateReceiptNo(): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.paymentReceipt.count({
    where: { receiptNo: { startsWith: `PR-${year}` } },
  });
  return generateDocNumber("PR", count + 1);
}

// ── Create ────────────────────────────────────

export async function createPaymentReceipt(
  input: ReceiptInput
): Promise<ActionResult<{ id: string; receiptNo: string }>> {
  try {
    const session = await requireSession();
    const parsed  = ReceiptSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal.", fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }

    const { partnerId, projectId, issueDate, paymentDate, paymentMethod, currency, description, notes, lineItems } = parsed.data;
    const totalAmount = lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const receiptNo   = await generateReceiptNo();

    const receipt = await prisma.$transaction(async (tx) => {
      const r = await tx.paymentReceipt.create({
        data: {
          receiptNo,
          issueDate:     new Date(issueDate),
          paymentDate:   paymentDate ? new Date(paymentDate) : null,
          paymentMethod: paymentMethod ?? null,
          status:        "DRAFT",
          currency,
          totalAmount,
          description,
          notes:         notes ?? null,
          partnerId,
          projectId:     projectId ?? null,
          createdById:   session.sub,
        },
      });
      await tx.paymentReceiptLineItem.createMany({
        data: lineItems.map((item, idx) => ({
          paymentReceiptId: r.id,
          description:      item.description,
          quantity:         item.qty,
          unitPrice:        item.unitPrice,
          totalPrice:       item.qty * item.unitPrice,
          order:            idx,
        })),
      });
      return r;
    });

    revalidatePath("/payment-receipts");
    revalidatePath("/");
    return { success: true, data: { id: receipt.id, receiptNo: receipt.receiptNo } };
  } catch (err) {
    console.error("[createPaymentReceipt]", err);
    return { success: false, error: "Gagal menyimpan payment receipt." };
  }
}

// ── Update ────────────────────────────────────

export async function updatePaymentReceipt(
  receiptId: string,
  input: ReceiptInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
    const parsed = ReceiptSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal.", fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }

    const existing = await prisma.paymentReceipt.findUnique({ where: { id: receiptId }, select: { status: true } });
    if (!existing)                    return { success: false, error: "Receipt tidak ditemukan." };
    if (existing.status !== "DRAFT")  return { success: false, error: "Hanya DRAFT yang bisa diedit." };

    const { partnerId, projectId, issueDate, paymentDate, paymentMethod, currency, description, notes, lineItems } = parsed.data;
    const totalAmount = lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);

    await prisma.$transaction(async (tx) => {
      await tx.paymentReceiptLineItem.deleteMany({ where: { paymentReceiptId: receiptId } });
      await tx.paymentReceipt.update({
        where: { id: receiptId },
        data: {
          issueDate:     new Date(issueDate),
          paymentDate:   paymentDate ? new Date(paymentDate) : null,
          paymentMethod: paymentMethod ?? null,
          currency, totalAmount, description,
          notes:         notes ?? null,
          partnerId,
          projectId:     projectId ?? null,
        },
      });
      await tx.paymentReceiptLineItem.createMany({
        data: lineItems.map((item, idx) => ({
          paymentReceiptId: receiptId,
          description:      item.description,
          quantity:         item.qty,
          unitPrice:        item.unitPrice,
          totalPrice:       item.qty * item.unitPrice,
          order:            idx,
        })),
      });
    });

    revalidatePath(`/payment-receipts/${receiptId}`);
    revalidatePath("/payment-receipts");
    revalidatePath("/");
    return { success: true, data: { id: receiptId } };
  } catch (err) {
    console.error("[updatePaymentReceipt]", err);
    return { success: false, error: "Gagal mengupdate receipt." };
  }
}

// ── Update Status ─────────────────────────────

export async function updateReceiptStatus(
  receiptId: string,
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED"
): Promise<ActionResult> {
  try {
    await requireSession();
    await prisma.paymentReceipt.update({ where: { id: receiptId }, data: { status } });
    revalidatePath(`/payment-receipts/${receiptId}`);
    revalidatePath("/payment-receipts");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Gagal update status." };
  }
}

// ── Delete ────────────────────────────────────

export async function deletePaymentReceipt(receiptId: string): Promise<ActionResult> {
  try {
    await requireSession();
    const r = await prisma.paymentReceipt.findUnique({ where: { id: receiptId }, select: { status: true } });
    if (!r)                   return { success: false, error: "Receipt tidak ditemukan." };
    if (r.status !== "DRAFT") return { success: false, error: "Hanya DRAFT yang bisa dihapus." };
    await prisma.paymentReceipt.delete({ where: { id: receiptId } });
    revalidatePath("/payment-receipts");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Gagal menghapus receipt." };
  }
}

// ── Queries ───────────────────────────────────

export async function getPaymentReceipts(filters?: { status?: string; partnerId?: string }) {
  return prisma.paymentReceipt.findMany({
    where: {
      ...(filters?.status    ? { status:    filters.status    as any } : {}),
      ...(filters?.partnerId ? { partnerId: filters.partnerId }        : {}),
    },
    include: {
      partner:   { select: { name: true, type: true } },
      project:   { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPaymentReceiptById(id: string) {
  return prisma.paymentReceipt.findUnique({
    where:   { id },
    include: {
      partner:      true,
      project:      { select: { name: true } },
      createdBy:    { select: { name: true } },
      lineItems:    { orderBy: { order: "asc" } },
      paymentProof: true,
    },
  });
}