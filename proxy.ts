import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session || !session.user.active) {
        return NextResponse.redirect(new URL("/sign-in", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!sign-in|sign-up|forgot-password|reset-password|api/auth|api/cron|_next).*)"]
}
