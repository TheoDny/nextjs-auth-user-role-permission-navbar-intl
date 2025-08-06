"use server"
import { SignUp } from "@/components/card/sign-up"
import { auth } from "@/lib/auth"
import jwt from "jsonwebtoken"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

type SignUpPageProps = {
    searchParams: Promise<{
        token?: string
    }>
}

export default async function SignUpPage(props: SignUpPageProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (session) {
        redirect("/")
    }

    const { token } = await props.searchParams
    //check the param "token" in the URL
    if (!token) {
        redirect("/sign-in")
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is required in configuration server")
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        name: string
        email: string
    }

    if (!decoded) {
        redirect("/sign-in")
    }

    return (
        <SignUp
            token={token}
            name={decoded.name}
            email={decoded.email}
        />
    )
}
