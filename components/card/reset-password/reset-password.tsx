"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputConceal } from "@/components/ui/input-conceal"
import { authClient } from "@/lib/auth-client"
import { Label } from "@radix-ui/react-label"
import { ArrowLeftIcon, CircleAlert, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

const validatePassword = (password: string, t: (key: string) => string) => {
    if (password.length < 16 || password.length > 128) {
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

export default function ResetPassword() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const tResetPassword = useTranslations("ResetPassword")
    const router = useRouter()

    return (
        <Card className="w-xs md:w-md relative">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">{tResetPassword("title")}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{tResetPassword("description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="absolute text-sm top-1 left-1 flex items-center gap-1 underline">
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
                        const email = (formData.get("email") as string)?.trim()
                        const otp = (formData.get("otp") as string)?.trim()
                        const password = formData.get("password") as string
                        const passwordConfirmation = formData.get("password_confirmation") as string

                        if (!email || !otp) {
                            setLoading(false)
                            const msg = tResetPassword("missingEmailOrOtp")
                            setError(msg)
                            toast.error(msg)
                            return
                        }

                        const passwordError = validatePassword(password, tResetPassword)
                        if (passwordError) {
                            setLoading(false)
                            setError(passwordError)
                            toast.error(passwordError)
                            return
                        }

                        if (password !== passwordConfirmation) {
                            setLoading(false)
                            setError(tResetPassword("passwordsDoNotMatch"))
                            toast.error(tResetPassword("passwordsDoNotMatch"))
                            return
                        }

                        await authClient.emailOtp.resetPassword(
                            {
                                email,
                                otp,
                                password,
                            },
                            {
                                onSuccess: () => {
                                    toast.success(tResetPassword("successMessage"))
                                    router.push("/sign-in")
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
                            <Label htmlFor="email">{tResetPassword("email")}</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="otp">{tResetPassword("otp")}</Label>
                            <Input
                                id="otp"
                                name="otp"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={12}
                                placeholder={tResetPassword("otpPlaceholder")}
                                required
                            />
                        </div>
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
                            <Label htmlFor="password_confirmation">{tResetPassword("confirmPassword")}</Label>
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
