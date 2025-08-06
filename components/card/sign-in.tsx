"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { InputConceal } from "../ui/input-conceal"

const signInSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
})

type SignInFormValues = z.infer<typeof signInSchema>

export function SignIn() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const tSignIn = useTranslations("SignIn")

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = async (data: SignInFormValues) => {
        setLoading(true)
        setError("")
        await signIn.email({
            email: data.email,
            password: data.password,
            fetchOptions: {
                onResponse: () => {
                    setLoading(false)
                },
                onRequest: () => {
                    setLoading(true)
                },
                onError: (ctx) => {
                    setError(ctx.error.message || ctx.error.statusText || "An error occurred")
                },
                onSuccess: async () => {
                    window.location.href = "/"
                },
            },
        })
    }

    return (
        <Card className="w-xs md:w-md">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">{tSignIn("title")}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{tSignIn("description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid gap-4"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="email">{tSignIn("email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            {...register("email")}
                        />
                        {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">{tSignIn("password")}</Label>
                            <Link
                                href="/forgot-password"
                                className="ml-auto inline-block text-sm underline"
                            >
                                {tSignIn("forgotPassword")}
                            </Link>
                        </div>

                        <InputConceal
                            id="password"
                            placeholder="password"
                            autoComplete="password"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
                        )}
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
                            tSignIn("login")
                        )}
                    </Button>
                    {error && (
                        <div className="p-2 items-center w-full rounded-md flex flex-row gap-2">
                            <CircleAlert className="text-destructive" />
                            <p className="text-destructive text-xs">{error}</p>
                        </div>
                    )}
                </form>
            </CardContent>
            <CardFooter>
                <div className="flex flex-col justify-center w-full border-t py-3">
                    <p className="text-xs text-muted-foreground text-center">{tSignIn("cookieConsent")}</p>
                </div>
            </CardFooter>
        </Card>
    )
}
