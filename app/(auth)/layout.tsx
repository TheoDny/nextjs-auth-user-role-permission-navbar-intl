import { AuthLayout } from "@/components/auth/AuthLayout"
import { Toaster } from "@/components/ui/sonner"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"
import type { ReactNode } from "react"
import "../globals.css"

interface RootLayoutProps {
    children: ReactNode
}

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "App name"

export default async function RootLayout({ children }: RootLayoutProps) {
    const locale = await getLocale()

    return (
        <html
            lang={locale}
            suppressHydrationWarning
        >
            <head>
                <title>{appName}</title>
                <link
                    rel="icon"
                    href="/favicon.ico"
                />
            </head>
            <body className="dark">
                <NextIntlClientProvider>
                    <Toaster />
                    <AuthLayout>{children}</AuthLayout>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
