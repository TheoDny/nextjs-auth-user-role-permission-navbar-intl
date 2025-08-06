"use server"
import { SignIn } from "@/components/card/sign-in"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function SignInPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (session) {
        redirect("/")
    }

    return (
            <SignIn />
    )
}
