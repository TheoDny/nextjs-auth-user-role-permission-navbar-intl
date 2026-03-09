import { clsx, type ClassValue } from "clsx"
import jwt from "jsonwebtoken"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function generateInviteToken(name: string, email: string, expiresAt: Date): string {
    const payload = {
        name,
        email,
        exp: expiresAt.getTime() / 1000, // Convert to seconds
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is required in configuration server")
    }

    return jwt.sign(payload, process.env.JWT_SECRET)
}

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
