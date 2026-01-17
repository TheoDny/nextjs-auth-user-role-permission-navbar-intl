import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env("DATABASE_USER") === "" ? env("DATABASE_URL") : `postgresql://${env("DATABASE_USER")}:${env("DATABASE_PASSWORD")}@${env("DATABASE_HOST")}:${env("DATABASE_PORT")}/${env("DATABASE_NAME")}?schema=public`,
  },
})
