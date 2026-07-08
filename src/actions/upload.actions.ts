// src/actions/upload.actions.ts
"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { ActionResult } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "payment-proofs");
const PUBLIC_PREFIX = "/uploads/payment-proofs";

// ─── Upload bukti pembayaran ──────────────────
// Dipakai untuk invoice ATAU payment receipt — kirim salah satu id

export async function uploadPaymentProof(
    formData: FormData
): Promise<ActionResult<{ id: string; url: string; mimeType: string }>> {
    try {
        await requireSession();

        const file = formData.get("file") as File | null;
        const receiptId = formData.get("receiptId") as string | null;
        const invoiceId = formData.get("invoiceId") as string | null;

        if (!file || file.size === 0) {
            return { success: false, error: "Pilih file terlebih dahulu." };
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return { success: false, error: "Format file harus JPG, PNG, WEBP, atau PDF." };
        }
        if (file.size > MAX_SIZE_BYTES) {
            return { success: false, error: "Ukuran file maksimal 5MB." };
        }
        if (!receiptId && !invoiceId) {
            return { success: false, error: "Dokumen tujuan tidak ditemukan." };
        }

        // Pastikan folder ada
        await mkdir(UPLOAD_DIR, { recursive: true });

        // Generate nama file unik
        const ext = file.name.split(".").pop() || "bin";
        const filename = `${randomUUID()}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filepath, buffer);

        // Hapus proof lama (kalau ada) untuk dokumen yang sama — replace, bukan numpuk
        if (receiptId) {
            await prisma.paymentProof.deleteMany({ where: { paymentReceiptId: receiptId } });
        }
        if (invoiceId) {
            await prisma.paymentProof.deleteMany({ where: { invoiceId } });
        }

        const proof = await prisma.paymentProof.create({
            data: {
                filename,
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                path: filepath,
                ...(receiptId ? { paymentReceiptId: receiptId } : {}),
                ...(invoiceId ? { invoiceId } : {}),
            },
        });

        if (receiptId) {
            revalidatePath(`/payment-receipts/${receiptId}`);
            revalidatePath(`/payment-receipts/${receiptId}/edit`);
        }
        if (invoiceId) {
            revalidatePath(`/invoices/${invoiceId}`);
            revalidatePath(`/invoices/${invoiceId}/edit`);
        }

        return {
            success: true,
            data: { id: proof.id, url: `${PUBLIC_PREFIX}/${filename}`, mimeType: file.type },
            message: "Bukti pembayaran berhasil diunggah.",
        };
    } catch (err) {
        console.error("[uploadPaymentProof]", err);
        return { success: false, error: "Gagal mengunggah file. Coba lagi." };
    }
}

// ─── Hapus bukti pembayaran ───────────────────

export async function deletePaymentProof(proofId: string): Promise<ActionResult> {
    try {
        await requireSession();

        const proof = await prisma.paymentProof.findUnique({ where: { id: proofId } });
        if (!proof) return { success: false, error: "File tidak ditemukan." };

        // Hapus file fisik — abaikan error kalau file sudah tidak ada
        try {
            await unlink(proof.path);
        } catch {
            /* file mungkin sudah terhapus manual, lanjutkan */
        }

        await prisma.paymentProof.delete({ where: { id: proofId } });

        if (proof.paymentReceiptId) revalidatePath(`/payment-receipts/${proof.paymentReceiptId}`);
        if (proof.invoiceId) revalidatePath(`/invoices/${proof.invoiceId}`);

        return { success: true, data: undefined, message: "Bukti pembayaran dihapus." };
    } catch (err) {
        console.error("[deletePaymentProof]", err);
        return { success: false, error: "Gagal menghapus file." };
    }
}