import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/sign-in", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!sign-in|sign-up|forgot-password|reset-password|api/auth|api/cron|_next).*)"],
}
