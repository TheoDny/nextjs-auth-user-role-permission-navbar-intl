import 'dotenv/config'
import { PrismaClient } from "@/prisma/generated"
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: ["warn", "error"],
    })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
