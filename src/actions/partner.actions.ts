// src/actions/partner.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { ActionResult } from "@/lib/utils";

const PartnerSchema = z.object({
  name:        z.string().min(2, "Nama minimal 2 karakter"),
  type:        z.enum(["FREELANCER", "VENDOR", "INTERNAL"]),
  email:       z.string().email("Format email tidak valid").optional().or(z.literal("")),
  phone:       z.string().optional(),
  bankName:    z.string().optional(),
  bankAccount: z.string().optional(),
  taxId:       z.string().optional(),
  notes:       z.string().optional(),
});

// ── Queries ───────────────────────────────────

export async function getPartners() {
  return prisma.partner.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true, email: true, bankName: true, bankAccount: true },
  });
}

export async function getPartnersWithStats() {
  return prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { paymentReceipts: true } } },
  });
}

export async function getPartnerById(id: string) {
  return prisma.partner.findUnique({
    where: { id },
    include: {
      paymentReceipts: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, receiptNo: true, status: true, totalAmount: true, issueDate: true },
      },
      _count: { select: { paymentReceipts: true } },
    },
  });
}

// ── Create ────────────────────────────────────

export async function createPartner(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
    const raw = {
      name:        formData.get("name"),
      type:        formData.get("type"),
      email:       formData.get("email")       || undefined,
      phone:       formData.get("phone")       || undefined,
      bankName:    formData.get("bankName")    || undefined,
      bankAccount: formData.get("bankAccount") || undefined,
      taxId:       formData.get("taxId")       || undefined,
      notes:       formData.get("notes")       || undefined,
    };
    const parsed = PartnerSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal.", fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const partner = await prisma.partner.create({ data: parsed.data });
    revalidatePath("/partners");
    return { success: true, data: { id: partner.id }, message: "Partner berhasil ditambahkan." };
  } catch {
    return { success: false, error: "Gagal menyimpan partner." };
  }
}

// ── Update ────────────────────────────────────

export async function updatePartner(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireSession();
    const raw = {
      name:        formData.get("name"),
      type:        formData.get("type"),
      email:       formData.get("email")       || undefined,
      phone:       formData.get("phone")       || undefined,
      bankName:    formData.get("bankName")    || undefined,
      bankAccount: formData.get("bankAccount") || undefined,
      taxId:       formData.get("taxId")       || undefined,
      notes:       formData.get("notes")       || undefined,
    };
    const parsed = PartnerSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal.", fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    await prisma.partner.update({ where: { id }, data: parsed.data });
    revalidatePath("/partners");
    return { success: true, data: undefined, message: "Partner berhasil diupdate." };
  } catch {
    return { success: false, error: "Gagal mengupdate partner." };
  }
}

// ── Delete ────────────────────────────────────

export async function deletePartner(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    const count = await prisma.paymentReceipt.count({ where: { partnerId: id } });
    if (count > 0) return { success: false, error: "Partner masih memiliki payment receipt." };
    await prisma.partner.delete({ where: { id } });
    revalidatePath("/partners");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Gagal menghapus partner." };
  }
}