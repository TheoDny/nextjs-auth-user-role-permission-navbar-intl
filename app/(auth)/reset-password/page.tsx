"use server"
import ResetPassword from "@/components/card/reset-password"
import { redirect } from "next/navigation"

type ResetPasswordProps = {
    token: string | undefined
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<ResetPasswordProps> }) {
    const { token } = await searchParams
    if (!token) {
        redirect("/sign-in")
    }

    return <ResetPassword token={token} />
}
