"use client"

import { deleteUserSessionAction } from "@/actions/user.action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { handleSafeActionResult } from "@/lib/utils.client"
import type { SessionModel as UserSession } from "@/prisma/generated/models/Session"
import { useConfirm } from "@/provider/ConfirmationProvider"
import { LoaderCircle, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

type AccountSessionsProps = {
    sessions: UserSession[]
    currentSessionId: string
}

export function AccountSessions({ sessions, currentSessionId }: AccountSessionsProps) {
    const t = useTranslations("Account")
    const tErrors = useTranslations("Errors")
    const { confirm } = useConfirm()
    const [sessionList, setSessionList] = useState(sessions)
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

    const handleDeleteSession = async (sessionId: string) => {
        if (sessionId === currentSessionId) {
            return
        }

        const confirmed = await confirm(t("sessions.confirmDeleteTitle"), t("sessions.confirmDeleteDescription"))
        if (!confirmed) {
            return
        }

        setDeletingSessionId(sessionId)
        try {
            const result = await deleteUserSessionAction({ sessionId })
            const handledResult = handleSafeActionResult(result, {
                error: toast.error,
                fallbackErrorMessage: tErrors("DeleteSessionFail"),
            })
            if (!handledResult.ok) {
                return
            }

            setSessionList((prev) => prev.filter((session) => session.id !== sessionId))
            toast.success(t("sessions.deleteSuccess"))
        } catch (error) {
            console.error(error)
            toast.error(tErrors("DeleteSessionFail"))
        } finally {
            setDeletingSessionId(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("sessions.title")}</CardTitle>
                <CardDescription>{t("sessions.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {sessionList.map((session) => {
                    const isCurrentSession = session.id === currentSessionId
                    const isDeleting = deletingSessionId === session.id
                    return (
                        <div
                            key={session.id}
                            className={`rounded-lg border p-3 ${
                                isCurrentSession ? "border-primary bg-primary/5" : "bg-muted/30"
                            }`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={isCurrentSession ? "default" : "outline"}>
                                        {isCurrentSession ? t("sessions.current") : t("sessions.other")}
                                    </Badge>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isCurrentSession || isDeleting}
                                    onClick={() => handleDeleteSession(session.id)}
                                >
                                    {isDeleting ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    <span className="ml-2">{t("sessions.deleteAction")}</span>
                                </Button>
                            </div>

                            <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                                <p>
                                    {t("sessions.device")}: {session.userAgent || t("sessions.unknownDevice")}
                                </p>
                                <p>
                                    {t("sessions.ipAddress")}: {session.ipAddress || t("sessions.unknownIpAddress")}
                                </p>
                                <p>
                                    {t("sessions.createdAt")}: {new Date(session.createdAt).toLocaleString()}
                                </p>
                                <p>
                                    {t("sessions.updatedAt")}: {new Date(session.updatedAt).toLocaleString()}
                                </p>
                                <p>
                                    {t("sessions.expiresAt")}: {new Date(session.expiresAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )
                })}

                {sessionList.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("sessions.noSessions")}</p>
                )}
            </CardContent>
        </Card>
    )
}
