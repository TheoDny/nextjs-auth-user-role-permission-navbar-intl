import { clsx, type ClassValue } from "clsx"
import { format, parseISO } from "date-fns"
import jwt from "jsonwebtoken"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, formatString: string = "PPP"): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    return format(dateObj, formatString)
}

export function isObjectEmpty(obj: Record<string, unknown>) {
    return Object.keys(obj).length === 0
}

export function generateInviteToken(name: string, email: string, expiresAt: Date): string {
    const secret = process.env.JWT_SECRET || "fallback-secret"

    const payload = {
        name,
        email,
        exp: expiresAt.getTime() / 1000, // Convert to seconds
    }

    return jwt.sign(payload, secret)
}

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
