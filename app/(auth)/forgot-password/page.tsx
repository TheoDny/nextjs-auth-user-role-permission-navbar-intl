"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { Label } from "@radix-ui/react-label"
import { ArrowLeftIcon, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const t = useTranslations("ForgotPassword")

    return (
        <Card className="w-xs md:w-md relative">
            <CardHeader className="mt-2">
                <CardTitle className="text-lg md:text-xl">{t("title")}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{t("description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="absolute top-1 left-1 flex items-center gap-1 underline">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <Link
                        id="back"
                        href="/sign-in"
                    >
                        {t("backToSignIn")}
                    </Link>
                </div>
                <form
                    action={async (formData) => {
                        const email = formData.get("email")

                        await authClient.requestPasswordReset(
                            {
                                email: email as string,
                                redirectTo: "/reset-password",
                            },
                            {
                                onSuccess: () => {
                                    toast.success("Email sent")
                                    setTimeout(() => {
                                        document.getElementById("back")?.click()
                                    }, 1500)
                                },
                                onError: (ctx) => {
                                    console.error(ctx)
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
                    }}
                >
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t("email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                placeholder="email"
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
                                t("sendLink")
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
