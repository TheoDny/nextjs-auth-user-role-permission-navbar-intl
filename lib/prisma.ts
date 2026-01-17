import { PrismaClient } from "@/prisma/generated/client"
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const connectionString = process.env.DATABASE_USER ? `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?schema=public` : process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: ["warn", "error"],
    })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
