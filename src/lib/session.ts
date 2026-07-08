// Baca dan tulis session JWT dari HttpOnly cookie
// Dipanggil dari Server Components, Server Actions, dan Route Handlers

import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./auth";

export const SESSION_COOKIE = "paydoc_session";

// ── Ambil session user yang sedang login ─────
export async function getSession(): Promise<JWTPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
}

// ── Wajib login — redirect jika tidak ada session ─
export async function requireSession(): Promise<JWTPayload> {
    const session = await getSession();
    if (!session) {
        // Dilempar sebagai error, ditangkap oleh middleware atau caller
        throw new Error("UNAUTHORIZED");
    }
    return session;
}

// ── Cek apakah user adalah ADMIN ─────────────
export async function requireAdmin(): Promise<JWTPayload> {
    const session = await requireSession();
    if (session.role !== "ADMIN") {
        throw new Error("FORBIDDEN");
    }
    return session;
}