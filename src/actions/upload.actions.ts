// src/actions/upload.actions.ts
// File upload menggunakan Vercel Blob (production) atau local disk (development)
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { ActionResult } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// ─── Upload handler ───────────────────────────

export async function uploadPaymentProof(
    formData: FormData
): Promise<ActionResult<{ id: string; url: string; mimeType: string }>> {
    try {
        await requireSession();

        const file = formData.get("file") as File | null;
        const receiptId = formData.get("receiptId") as string | null;
        const invoiceId = formData.get("invoiceId") as string | null;

        if (!file || file.size === 0)
            return { success: false, error: "Pilih file terlebih dahulu." };
        if (!ALLOWED_TYPES.includes(file.type))
            return { success: false, error: "Format file harus JPG, PNG, WEBP, atau PDF." };
        if (file.size > MAX_SIZE_BYTES)
            return { success: false, error: "Ukuran file maksimal 5MB." };
        if (!receiptId && !invoiceId)
            return { success: false, error: "Dokumen tujuan tidak ditemukan." };

        let fileUrl: string;
        let filename: string;

        if (process.env.NODE_ENV === "production" || process.env.BLOB_READ_WRITE_TOKEN) {
            // ── Production: Vercel Blob ──────────────
            const { put } = await import("@vercel/blob");
            const ext = file.name.split(".").pop() || "bin";
            const prefix = receiptId ? `receipts/${receiptId}` : `invoices/${invoiceId}`;
            filename = `${prefix}-${Date.now()}.${ext}`;

            const blob = await put(filename, file, {
                access: "public",
                contentType: file.type,
            });
            fileUrl = blob.url;
            filename = blob.pathname;
        } else {
            // ── Development: Local disk ───────────────
            const { writeFile, mkdir } = await import("fs/promises");
            const path = await import("path");
            const { randomUUID } = await import("crypto");

            const UPLOAD_DIR = path.default.join(process.cwd(), "public", "uploads", "payment-proofs");
            const PUBLIC_PREFIX = "/uploads/payment-proofs";
            await mkdir(UPLOAD_DIR, { recursive: true });

            const ext = file.name.split(".").pop() || "bin";
            filename = `${randomUUID()}.${ext}`;
            const filepath = path.default.join(UPLOAD_DIR, filename);

            await writeFile(filepath, Buffer.from(await file.arrayBuffer()));
            fileUrl = `${PUBLIC_PREFIX}/${filename}`;
        }

        // Hapus proof lama untuk dokumen yang sama (replace, bukan numpuk)
        const oldProofs = receiptId
            ? await prisma.paymentProof.findMany({ where: { paymentReceiptId: receiptId } })
            : await prisma.paymentProof.findMany({ where: { invoiceId: invoiceId! } });

        // Hapus file lama dari Vercel Blob kalau ada
        if (oldProofs.length > 0 && (process.env.NODE_ENV === "production" || process.env.BLOB_READ_WRITE_TOKEN)) {
            try {
                const { del } = await import("@vercel/blob");
                for (const old of oldProofs) {
                    if (old.path.startsWith("http")) await del(old.path);
                }
            } catch { /* abaikan error delete */ }
        }

        if (receiptId) await prisma.paymentProof.deleteMany({ where: { paymentReceiptId: receiptId } });
        if (invoiceId) await prisma.paymentProof.deleteMany({ where: { invoiceId } });

        const proof = await prisma.paymentProof.create({
            data: {
                filename,
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                path: fileUrl, // simpan URL (bisa local path atau blob URL)
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
        }

        return {
            success: true,
            data: { id: proof.id, url: fileUrl, mimeType: file.type },
        };
    } catch (err) {
        console.error("[uploadPaymentProof]", err);
        return { success: false, error: "Gagal mengunggah file. Coba lagi." };
    }
}

// ─── Delete ───────────────────────────────────

export async function deletePaymentProof(proofId: string): Promise<ActionResult> {
    try {
        await requireSession();

        const proof = await prisma.paymentProof.findUnique({ where: { id: proofId } });
        if (!proof) return { success: false, error: "File tidak ditemukan." };

        // Hapus dari storage
        if (proof.path.startsWith("http")) {
            // Vercel Blob
            try {
                const { del } = await import("@vercel/blob");
                await del(proof.path);
            } catch { /* abaikan */ }
        } else {
            // Local disk
            try {
                const { unlink } = await import("fs/promises");
                const path = await import("path");
                const localPath = path.default.join(process.cwd(), "public", proof.path);
                await unlink(localPath);
            } catch { /* file mungkin sudah tidak ada */ }
        }

        await prisma.paymentProof.delete({ where: { id: proofId } });

        if (proof.paymentReceiptId) revalidatePath(`/payment-receipts/${proof.paymentReceiptId}`);
        if (proof.invoiceId) revalidatePath(`/invoices/${proof.invoiceId}`);

        return { success: true, data: undefined };
    } catch (err) {
        console.error("[deletePaymentProof]", err);
        return { success: false, error: "Gagal menghapus file." };
    }
}