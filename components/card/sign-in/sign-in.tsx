"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient, signIn } from "@/lib/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { InputConceal } from "../../ui/input-conceal"

const signInSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
})

type SignInFormValues = z.infer<typeof signInSchema>

const otpEmailSchema = z.object({
    email: z.email("Please enter a valid email"),
})

const otpVerifySchema = z.object({
    otp: z.string().regex(/^\d{6}$/, "Invalid code"),
})

type OtpEmailValues = z.infer<typeof otpEmailSchema>
type OtpVerifyValues = z.infer<typeof otpVerifySchema>

type AuthTab = "password" | "otp"

const fetchOpts = (setLoading: (v: boolean) => void, setErrorMsg: (msg: string) => void) => ({
    onResponse: () => setLoading(false),
    onRequest: () => setLoading(true),
    onError: (ctx: { error: { message?: string; statusText?: string } }) => {
        setErrorMsg(ctx.error.message || ctx.error.statusText || "An error occurred")
    },
})

export function SignIn() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [tab, setTab] = useState<AuthTab>("password")
    const [otpStep, setOtpStep] = useState<"email" | "code">("email")
    const [otpEmail, setOtpEmail] = useState("")
    const tSignIn = useTranslations("SignIn")

    const passwordForm = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: { email: "", password: "" },
    })

    const otpEmailForm = useForm<OtpEmailValues>({
        resolver: zodResolver(otpEmailSchema),
        defaultValues: { email: "" },
    })

    const otpCodeForm = useForm<OtpVerifyValues>({
        resolver: zodResolver(otpVerifySchema),
        defaultValues: { otp: "" },
    })

    const setTabAndResetOtp = (next: AuthTab) => {
        setTab(next)
        setError("")
        setOtpStep("email")
        setOtpEmail("")
        otpEmailForm.reset()
        otpCodeForm.reset()
    }

    const onPasswordSubmit = async (data: SignInFormValues) => {
        setLoading(true)
        setError("")
        await signIn.email({
            email: data.email,
            password: data.password,
            fetchOptions: {
                ...fetchOpts(setLoading, setError),
                onSuccess: async () => {
                    window.location.href = "/"
                },
            },
        })
    }

    const onSendOtp = async (data: OtpEmailValues) => {
        setLoading(true)
        setError("")
        await authClient.emailOtp.sendVerificationOtp(
            { email: data.email, type: "sign-in" },
            {
                ...fetchOpts(setLoading, setError),
                onSuccess: () => {
                    setOtpEmail(data.email)
                    setOtpStep("code")
                    otpCodeForm.reset()
                },
            },
        )
    }

    const onOtpSignIn = async (data: OtpVerifyValues) => {
        setLoading(true)
        setError("")
        await signIn.emailOtp(
            { email: otpEmail, otp: data.otp },
            {
                ...fetchOpts(setLoading, setError),
                onSuccess: async () => {
                    window.location.href = "/"
                },
            },
        )
    }

    const onResendOtp = async () => {
        if (!otpEmail) return
        setLoading(true)
        setError("")
        await authClient.emailOtp.sendVerificationOtp(
            { email: otpEmail, type: "sign-in" },
            {
                ...fetchOpts(setLoading, setError),
                onSuccess: () => {},
            },
        )
    }

    return (
        <Card className="w-xs md:w-md">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">{tSignIn("title")}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{tSignIn("description")}</CardDescription>
                <div className="flex gap-2 pt-2">
                    <Button
                        type="button"
                        variant={tab === "password" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setTabAndResetOtp("password")}
                    >
                        {tSignIn("tabPassword")}
                    </Button>
                    <Button
                        type="button"
                        variant={tab === "otp" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setTabAndResetOtp("otp")}
                    >
                        {tSignIn("tabEmailCode")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {tab === "password" ? (
                    <form
                        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                        className="grid gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="email">{tSignIn("email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                {...passwordForm.register("email")}
                            />
                            {passwordForm.formState.errors.email && (
                                <p className="text-destructive text-xs mt-1">{passwordForm.formState.errors.email.message}</p>
                            )}
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
                                {...passwordForm.register("password")}
                            />
                            {passwordForm.formState.errors.password && (
                                <p className="text-destructive text-xs mt-1">{passwordForm.formState.errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : tSignIn("login")}
                        </Button>
                        {error && (
                            <div className="p-2 items-center w-full rounded-md flex flex-row gap-2">
                                <CircleAlert className="text-destructive" />
                                <p className="text-destructive text-xs">{error}</p>
                            </div>
                        )}
                    </form>
                ) : otpStep === "email" ? (
                    <form
                        onSubmit={otpEmailForm.handleSubmit(onSendOtp)}
                        className="grid gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="otp-email">{tSignIn("email")}</Label>
                            <Input
                                id="otp-email"
                                type="email"
                                placeholder="m@example.com"
                                autoComplete="email"
                                {...otpEmailForm.register("email")}
                            />
                            {otpEmailForm.formState.errors.email && (
                                <p className="text-destructive text-xs mt-1">{otpEmailForm.formState.errors.email.message}</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : tSignIn("sendCode")}
                        </Button>
                        {error && (
                            <div className="p-2 items-center w-full rounded-md flex flex-row gap-2">
                                <CircleAlert className="text-destructive" />
                                <p className="text-destructive text-xs">{error}</p>
                            </div>
                        )}
                    </form>
                ) : (
                    <form
                        onSubmit={otpCodeForm.handleSubmit(onOtpSignIn)}
                        className="grid gap-4"
                    >
                        <p className="text-muted-foreground text-sm">{tSignIn("codeSent")}</p>
                        <p className="text-xs text-muted-foreground break-all">{otpEmail}</p>
                        <div className="grid gap-2">
                            <Label htmlFor="otp-code">{tSignIn("otp")}</Label>
                            <Input
                                id="otp-code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder={tSignIn("otpPlaceholder")}
                                {...otpCodeForm.register("otp")}
                            />
                            {otpCodeForm.formState.errors.otp && (
                                <p className="text-destructive text-xs mt-1">{otpCodeForm.formState.errors.otp.message}</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : tSignIn("signInWithOtp")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={loading}
                            onClick={onResendOtp}
                        >
                            {tSignIn("resendCode")}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                                setOtpStep("email")
                                setError("")
                                otpCodeForm.reset()
                            }}
                        >
                            {tSignIn("useOtherEmail")}
                        </Button>
                        {error && (
                            <div className="p-2 items-center w-full rounded-md flex flex-row gap-2">
                                <CircleAlert className="text-destructive" />
                                <p className="text-destructive text-xs">{error}</p>
                            </div>
                        )}
                    </form>
                )}
            </CardContent>
            <CardFooter>
                <div className="flex flex-col justify-center w-full border-t py-3">
                    <p className="text-xs text-muted-foreground text-center">{tSignIn("cookieConsent")}</p>
                </div>
            </CardFooter>
        </Card>
    )
}
