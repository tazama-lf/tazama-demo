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
  },
  client: {},
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    NATS_SERVER_URL: process.env.NATS_SERVER_URL,
    ADMIN_SERVICE_URL: process.env.ADMIN_SERVICE_URL,
    TMS_SERVER_URL: process.env.TMS_SERVER_URL,
  },
})
