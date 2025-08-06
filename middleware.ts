import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
    console.info("middleware")
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    console.info("session", session?.user?.email)

    if (!session || !session.user.active) {
        return NextResponse.redirect(new URL("/sign-in", request.url))
    }

    return NextResponse.next()
}

export const config = {
    runtime: "nodejs",
    matcher: ["/((?!sign-in|sign-up|forgot-password|reset-password|api/auth|_next).*)"],
}
