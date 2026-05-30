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
    // AUTHENTICATED=true requires NEXTAUTH_SECRET + Keycloak vars at runtime.
    AUTHENTICATED: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    NEXTAUTH_SECRET: z.string().optional(),
    KEYCLOAK_ISSUER: z.string().url().optional(),
    KEYCLOAK_CLIENT_ID: z.string().optional(),
    KEYCLOAK_CLIENT_SECRET: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    NATS_SERVER_URL: process.env.NATS_SERVER_URL,
    ADMIN_SERVICE_URL: process.env.ADMIN_SERVICE_URL,
    TMS_SERVER_URL: process.env.TMS_SERVER_URL,
    AUTHENTICATED: process.env.AUTHENTICATED,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
  },
})
