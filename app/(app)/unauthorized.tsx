import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

export default async function Unauthorized() {
    const tUnauthorized = await getTranslations("Unauthorized")
    return (
        <main className="flex justify-center items-center h-full w-full">
            <Card className="w-full max-w-md shadow-xl border-destructive border bg-destructive/20">
                <CardHeader className="flex flex-col items-center text-center">
                    <ShieldAlert className="w-12 h-12 text-destructive mb-2" />
                    <CardTitle className="text-2xl">{tUnauthorized("title")}</CardTitle>
                    <CardDescription>{tUnauthorized("description")}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button variant="link">
                        <Link href="/">{tUnauthorized("backToHome")}</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    )
}
