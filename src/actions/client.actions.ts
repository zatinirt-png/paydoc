// src/actions/client.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { ActionResult } from "@/lib/utils";

// ─── Schema ──────────────────────────────────

const ClientSchema = z.object({
  name:    z.string().min(2, "Nama minimal 2 karakter"),
  email:   z.string().email("Format email tidak valid").optional().or(z.literal("")),
  phone:   z.string().optional(),
  address: z.string().optional(),
  taxId:   z.string().optional(),
  notes:   z.string().optional(),
});

// ─── GET ALL (ringan, untuk dropdown) ────────

export async function getClients() {
  return prisma.client.findMany({
    orderBy: { name: "asc" },
    select: {
      id:      true,
      name:    true,
      email:   true,
      address: true,
      phone:   true,
    },
  });
}

// ─── GET ALL WITH STATS (untuk halaman list) ──

export async function getClientsWithStats() {
  return prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { invoices: true } },
    },
  });
}

// ─── GET SINGLE ───────────────────────────────

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where:   { id },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, invoiceNo: true, status: true, totalAmount: true, issueDate: true },
      },
      _count: { select: { invoices: true } },
    },
  });
}

// ─── CREATE ──────────────────────────────────

export async function createClient(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();

    const raw = {
      name:    formData.get("name"),
      email:   formData.get("email") || undefined,
      phone:   formData.get("phone") || undefined,
      address: formData.get("address") || undefined,
      taxId:   formData.get("taxId") || undefined,
      notes:   formData.get("notes") || undefined,
    };

    const parsed = ClientSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error:  "Validasi gagal.",
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const client = await prisma.client.create({ data: parsed.data });
    revalidatePath("/clients");

    return { success: true, data: { id: client.id }, message: "Klien berhasil ditambahkan." };
  } catch (err) {
    return { success: false, error: "Gagal menyimpan klien." };
  }
}

// ─── UPDATE ──────────────────────────────────

export async function updateClient(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireSession();

    const raw = {
      name:    formData.get("name"),
      email:   formData.get("email") || undefined,
      phone:   formData.get("phone") || undefined,
      address: formData.get("address") || undefined,
      taxId:   formData.get("taxId") || undefined,
      notes:   formData.get("notes") || undefined,
    };

    const parsed = ClientSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error:  "Validasi gagal.",
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await prisma.client.update({ where: { id }, data: parsed.data });
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);

    return { success: true, data: undefined, message: "Klien berhasil diupdate." };
  } catch (err) {
    return { success: false, error: "Gagal mengupdate klien." };
  }
}

// ─── DELETE ──────────────────────────────────

export async function deleteClient(id: string): Promise<ActionResult> {
  try {
    await requireSession();

    const hasInvoices = await prisma.invoice.count({ where: { clientId: id } });
    if (hasInvoices > 0) {
      return {
        success: false,
        error: "Klien tidak bisa dihapus karena masih memiliki invoice.",
      };
    }

    await prisma.client.delete({ where: { id } });
    revalidatePath("/clients");

    return { success: true, data: undefined, message: "Klien berhasil dihapus." };
  } catch (err) {
    return { success: false, error: "Gagal menghapus klien." };
  }
}