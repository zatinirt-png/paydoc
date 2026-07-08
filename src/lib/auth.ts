// JWT helpers — sign token saat login, verify token saat request masuk
// Menggunakan jose (kompatibel dengan Edge Runtime untuk middleware)

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "fallback_secret_ganti_ini"
);

export type JWTPayload = {
    sub: string; // user id
    email: string;
    name: string;
    role: string;
};

// ── Sign token ───────────────────────────────
export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "7d")
        .sign(JWT_SECRET);
}

// ── Verify token ─────────────────────────────
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

// ── Password helpers ─────────────────────────
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
