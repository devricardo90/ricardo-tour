// RT-104: every Prisma CLI command loads this file, so the database guard runs here, before Prisma connects.
// - Only `.env.local` (local development) is loaded — never the repository `.env`, which may hold a hosted URL.
//   Variables already in the environment win (explicit DATABASE_URL=… is still checked by the guard).
// - guardPrismaCli denies by default: a connection is allowed only to a positively identified local isolated database
//   or to an allowlisted hosted target (none today). Commands without a connection (generate, validate, format) pass.
// This protects Prisma runs that use this config; it cannot protect a different config, psql, or the app runtime.
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'
import { guardPrismaCli } from './lib/db/guard-runtime.mjs'

loadEnv({ path: '.env.local', quiet: true })
guardPrismaCli(process.argv.slice(2))

const databaseUrl = process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  ...(databaseUrl
    ? {
        datasource: {
          url: databaseUrl,
        },
      }
    : {}),
})
