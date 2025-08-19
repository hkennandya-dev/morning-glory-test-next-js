import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME!,
  },
} satisfies Config;
