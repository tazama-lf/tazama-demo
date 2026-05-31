import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    ANALYZE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    NATS_SERVER_URL: z.string().url().optional(),
    ADMIN_SERVICE_URL: z.string().url().optional(),
    TMS_SERVER_URL: z.string().url().optional(),
    // Authentication - all optional so builds pass without them.
    // AUTHENTICATED=true requires NEXTAUTH_SECRET + AUTH_SERVICE_URL at runtime
    // (enforced by lib/auth.ts at startup).
    AUTHENTICATED: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    NEXTAUTH_SECRET: z.string().optional(),
    AUTH_SERVICE_URL: z.string().url().optional(),
  },
  client: {},
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    NATS_SERVER_URL: process.env.NATS_SERVER_URL,
    ADMIN_SERVICE_URL: process.env.ADMIN_SERVICE_URL,
    TMS_SERVER_URL: process.env.TMS_SERVER_URL,
    AUTHENTICATED: process.env.AUTHENTICATED,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  },
})
