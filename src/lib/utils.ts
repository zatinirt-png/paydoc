// ── Format Rupiah ────────────────────────────
export function formatIDR(amount: number | string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
}

// ── Format tanggal ───────────────────────────
export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

// ── Generate document number ─────────────────
// Contoh: INV-2024-0001 atau PR-2024-0001
export function generateDocNumber(prefix: string, sequence: number): string {
    const year = new Date().getFullYear();
    const seq = String(sequence).padStart(4, "0");
    return `${prefix}-${year}-${seq}`;
}

// ── Class name merger (tanpa clsx/cn dependency) ─
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}

// ── Action response type ─────────────────────
export type ActionResult<T = void> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string; fields?: Record<string, string[]> };