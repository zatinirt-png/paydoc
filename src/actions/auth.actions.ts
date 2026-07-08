"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, hashPassword, comparePassword } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";
import type { ActionResult } from "@/lib/utils";

// ── Schemas ──────────────────────────────────

const RegisterSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
});

const LoginSchema = z.object({
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi"),
});

// ── Register ─────────────────────────────────

export async function register(
    _prevState: ActionResult,
    formData: FormData
): Promise<ActionResult> {
    const raw = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
    };

    const parsed = RegisterSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            error: "Validasi gagal.",
            fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    const { name, email, password } = parsed.data;

    // Cek apakah email sudah terdaftar
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return { success: false, error: "Email sudah terdaftar." };
    }

    // Buat user baru
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
    });

    // Buat token dan set cookie
    const token = await signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 hari
        path: "/",
    });

    redirect("/");
}

// ── Login ─────────────────────────────────────

export async function login(
    _prevState: ActionResult,
    formData: FormData
): Promise<ActionResult> {
    const raw = {
        email: formData.get("email"),
        password: formData.get("password"),
    };

    const parsed = LoginSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            success: false,
            error: "Validasi gagal.",
            fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    const { email, password } = parsed.data;

    // Cari user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { success: false, error: "Email atau password salah." };
    }

    // Verifikasi password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
        return { success: false, error: "Email atau password salah." };
    }

    // Buat token dan set cookie
    const token = await signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
    });

    redirect("/");
}

// ── Logout ────────────────────────────────────

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    redirect("/login");
}