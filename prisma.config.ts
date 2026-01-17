import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_USER ? `postgresql://${env("DATABASE_USER")}:${env("DATABASE_PASSWORD")}@${env("DATABASE_HOST")}:${env("DATABASE_PORT")}/${env("DATABASE_NAME")}?schema=public` : env("DATABASE_URL"),
  },
})
