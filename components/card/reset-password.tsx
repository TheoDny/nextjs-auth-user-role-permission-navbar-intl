"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputConceal } from "@/components/ui/input-conceal"
import { authClient } from "@/lib/auth-client"
import { Label } from "@radix-ui/react-label"
import { ArrowLeftIcon, CircleAlert, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

type ResetPasswordProps = {
    token: string
}

const validatePassword = (password: string, t: (key: string) => string) => {
    if (password.length < 16 || password.length > 64) {
        return t("passwordLength")
    }

    if (!/[A-Z]/.test(password)) {
        return t("passwordUppercase")
    }

    if (!/[0-9]/.test(password)) {
        return t("passwordNumber")
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return t("passwordSpecialChar")
    }

    return null
}

export default function ResetPassword({ token }: ResetPasswordProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const tResetPassword = useTranslations("ResetPassword")
    return (
        <Card className="w-xs md:w-md relative">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">{tResetPassword("title")}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{tResetPassword("description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="absolute top-1 left-1 flex items-center gap-1 underline">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <Link
                        id="back"
                        href="/sign-in"
                    >
                        {tResetPassword("backToSignIn")}
                    </Link>
                </div>
                <form
                    action={async (formData) => {
                        setLoading(true)
                        setError("")
                        const password = formData.get("password") as string
                        const passwordConfirmation = formData.get("password_confirmation") as string

                        // Validate password requirements
                        const passwordError = validatePassword(password, tResetPassword)
                        if (passwordError) {
                            setLoading(false)
                            setError(passwordError)
                            toast.error(passwordError)
                            return
                        }

                        // Check password confirmation
                        if (password !== passwordConfirmation) {
                            setLoading(false)
                            setError(tResetPassword("passwordsDoNotMatch"))
                            toast.error(tResetPassword("passwordsDoNotMatch"))
                            return
                        }

                        await authClient.resetPassword(
                            {
                                token,
                                newPassword: password,
                            },
                            {
                                onSuccess: () => {
                                    toast.success(tResetPassword("successMessage"))
                                },
                                onError: (ctx) => {
                                    console.error(ctx)
                                    setError(ctx.error.message)
                                    toast.error(ctx.error.message)
                                },
                                onResponse: () => {
                                    setLoading(false)
                                },
                                onRequest: () => {
                                    setLoading(true)
                                },
                            },
                        )
                        setLoading(false)
                    }}
                >
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">{tResetPassword("password")}</Label>
                            <InputConceal
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                placeholder={tResetPassword("passwordPlaceholder")}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">{tResetPassword("confirmPassword")}</Label>
                            <InputConceal
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder={tResetPassword("confirmPasswordPlaceholder")}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                tResetPassword("changePassword")
                            )}
                        </Button>
                        {error && (
                            <div className="p-2 items-center w-full rounded-md flex flex-row gap-2">
                                <CircleAlert className="text-destructive" />
                                <p className="text-destructive text-xs">{error}</p>
                            </div>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
