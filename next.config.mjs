import withBundleAnalyzer from "@next/bundle-analyzer"
import { env } from "./env.mjs"

/**
 * @type {import('next').NextConfig}
 */
const config = withBundleAnalyzer({ enabled: env.ANALYZE ?? false })({
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  sassOptions: {
    implementation: "sass-embedded",
  },
  rewrites() {
    return [
      { source: "/healthz", destination: "/api/health" },
      { source: "/api/healthz", destination: "/api/health" },
      { source: "/health", destination: "/api/health" },
      { source: "/ping", destination: "/api/health" },
    ]
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate, proxy-revalidate, max-age-0" }],
      },
    ]
  },
})

export default config
