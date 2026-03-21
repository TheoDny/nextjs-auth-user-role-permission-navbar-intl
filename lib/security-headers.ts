import type { NextResponse } from "next/server"

const STATIC_SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
    },
]

const HSTS_VALUE = "max-age=63072000; includeSubDomains; preload"

/**
 * Applies shared security headers to an outgoing proxy/middleware response (redirect or `next`).
 */
export function applySecurityHeadersToResponse<T extends NextResponse>(response: T): T {
    for (const { key, value } of STATIC_SECURITY_HEADERS) {
        response.headers.set(key, value)
    }
    if (process.env.NODE_ENV === "production") {
        response.headers.set("Strict-Transport-Security", HSTS_VALUE)
    }
    return response
}

/**
 * Same header set for `next.config.ts` `headers()` so paths outside the proxy matcher (e.g. `_next/static`) are covered.
 */
export function securityHeadersForNextConfig(): { key: string; value: string }[] {
    const headers = STATIC_SECURITY_HEADERS.map((h) => ({ ...h }))
    if (process.env.NODE_ENV === "production") {
        headers.push({ key: "Strict-Transport-Security", value: HSTS_VALUE })
    }
    return headers
}
