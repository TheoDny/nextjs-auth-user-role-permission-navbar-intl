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
            <div className="absolute top-5 left-5">
                <p>admin connection:</p>
                <p>admin@admin.com</p>
                <p>Admin0123456789!</p>
                <br />
                <p>The database is reset everyday at 00:00</p>
            </div>
            <SignIn />
        </>
    )
}
