"use server"

import { auth } from "@/lib/auth"
import { actionClient } from "@/lib/safe-action"
import { getLogs } from "@/services/log.service"
import { subDays } from "date-fns"
import { headers } from "next/headers"
import { z } from "zod"

// Schéma pour la validation des entrées
const getLogsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(), 
})

export const getLogsAction = actionClient.inputSchema(getLogsSchema).action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    const entityIds = session.user.Entities.map((entity: { id: string }) => entity.id)

    // Convertir les dates string en objets Date
    const startDate = parsedInput.startDate ? new Date(parsedInput.startDate) : subDays(new Date(), 7)
    const endDate = parsedInput.endDate ? new Date(parsedInput.endDate) : new Date()

    const logs = await getLogs(entityIds, startDate, endDate)

    return logs
})
