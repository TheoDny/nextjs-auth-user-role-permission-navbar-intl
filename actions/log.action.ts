"use server"

import { checkAuth } from "@/lib/auth-guard"
import { actionClient } from "@/lib/safe-action"
import { getLogs } from "@/services/log/log.service"
import { subDays } from "date-fns"
import { z } from "zod"

// Schéma pour la validation des entrées
const getLogsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
})

export const getLogsAction = actionClient.inputSchema(getLogsSchema).action(async ({ parsedInput }) => {
    const session = await checkAuth({ requiredPermission: "log_read" })

    const entityIds = session.user.Entities.map((entity: { id: string }) => entity.id)

    // Convertir les dates string en objets Date
    const startDate = parsedInput.startDate ? new Date(parsedInput.startDate) : subDays(new Date(), 7)
    const endDate = parsedInput.endDate ? new Date(parsedInput.endDate) : new Date()

    const logs = await getLogs(entityIds, startDate, endDate)

    return logs
})
