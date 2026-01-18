"use client"

import { signUpAction } from "@/actions/user.action"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputConceal } from "@/components/ui/input-conceal"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type SignUpProps = {
    token: string
    name: string
    email: string
}

const createSignUpSchema = (t: (key: string) => string) =>
    z
        .object({
            password: z
                .string()
                .min(16, t("passwordLength"))
                .max(64, t("passwordLength"))
                .regex(/[A-Z]/, t("passwordUppercase"))
                .regex(/[0-9]/, t("passwordNumber"))
                .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, t("passwordSpecialChar")),
            passwordConfirmation: z.string().min(1, "Please confirm your password"),
        })
        .refine((data) => data.password === data.passwordConfirmation, {
            message: "Passwords do not match",
            path: ["passwordConfirmation"],
        })

type SignUpFormValues = z.infer<ReturnType<typeof createSignUpSchema>>

export function SignUp({ token, name, email }: SignUpProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const tSignUp = useTranslations("SignUp")

    const signUpSchema = createSignUpSchema(tSignUp)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            password: "",
            passwordConfirmation: "",
        },
    })

    const onSubmit = async (data: SignUpFormValues) => {
        setError("")
        setLoading(true)
        const result = await signUpAction({
            email,
            password: data.password,
            passwordConfirmation: data.passwordConfirmation,
            token,
        })

        if (result?.serverError) {
            setLoading(false)
            return setError(result?.serverError)
        } else if (result?.validationErrors) {
            setLoading(false)
            return setError("Failed to sign up role")
        } else if (!result?.data) {
            setLoading(false)
            return setError("Failed to sign up role")
        }

        setLoading(false)
        window.location.href = "/sign-in"
    }

    return (
        <Card className="z-50 rounded-md rounded-t-none max-w-md w-full">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">{tSignUp("title")}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{tSignUp("description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid gap-4"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">{tSignUp("name")}</Label>
                        <h2 className="pl-4 font-bold">{name}</h2>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">{tSignUp("email")}</Label>
                        <h2 className="pl-4 font-bold">{email}</h2>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">{tSignUp("password")}</Label>
                        <InputConceal
                            id="password"
                            autoComplete="new-password"
                            placeholder="Password"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="passwordConfirmation">{tSignUp("confirmPassword")}</Label>
                        <InputConceal
                            id="passwordConfirmation"
                            autoComplete="new-password"
                            placeholder="Confirm Password"
                            {...register("passwordConfirmation")}
                        />
                        {errors.passwordConfirmation && (
                            <p className="text-destructive text-xs mt-1">{errors.passwordConfirmation.message}</p>
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
                            tSignUp("createAccount")
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
        </Card>
    )
}
