import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

import { applySecurityHeadersToResponse } from "@/lib/security-headers"

export async function proxy(request: NextRequest) {
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
        return applySecurityHeadersToResponse(NextResponse.redirect(new URL("/sign-in", request.url)))
    }

    return applySecurityHeadersToResponse(NextResponse.next())
}

export const config = {
    matcher: ["/((?!sign-in|sign-up|forgot-password|reset-password|unauthorized|api/auth|api/cron|_next).*)"],
}
