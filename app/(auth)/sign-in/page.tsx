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
        <>
            <div className="absolute top-5 right-5 flex flex-col items-center justify-center h-screen">
                <p>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL}</p>
                <p>BETTER_AUTH_URL: {process.env.BETTER_AUTH_URL}</p>
                <p>VERCEL_URL: {process.env.VERCEL_URL}</p>
            </div>
            <SignIn />
        </>
    )
}
