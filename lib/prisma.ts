import type { Prisma } from "@/prisma/generated/client"
import { PrismaClient } from "@/prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"
import pg from "pg"

const { Pool } = pg

const globalForPrisma = global as unknown as { prisma: PrismaClient }
type PrismaClientLike = PrismaClient | Prisma.TransactionClient
let prismaClientOverride: PrismaClientLike | undefined

const connectionString = process.env.DATABASE_USER
    ? `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?schema=public`
    : process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prismaRoot =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: ["warn", "error"],
    })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaRoot

const resolvePrismaClient = (): PrismaClientLike => prismaClientOverride ?? prismaRoot

export const prisma = new Proxy(prismaRoot, {
    get(_target, prop, receiver) {
        const current = resolvePrismaClient() as unknown as Record<string, unknown>
        const value = Reflect.get(current, prop, receiver)
        return typeof value === "function" ? (value as Function).bind(current) : value
    },
}) as PrismaClient

export function setPrismaClientForTesting(client?: PrismaClientLike) {
    if (process.env.NODE_ENV !== "test") {
        return
    }
    prismaClientOverride = client
}

export const prismaTestRootClient = prismaRoot
