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
      // Liveness aliases - all point at the cheap /api/health probe.
      { source: "/healthz", destination: "/api/health" },
      { source: "/api/healthz", destination: "/api/health" },
      { source: "/health", destination: "/api/health" },
      { source: "/ping", destination: "/api/health" },
      // Readiness aliases - dependency-aware /api/ready probe.
      { source: "/ready", destination: "/api/ready" },
      { source: "/readyz", destination: "/api/ready" },
      { source: "/api/readyz", destination: "/api/ready" },
      // Build-info aliases.
      { source: "/version", destination: "/api/version" },
      { source: "/api/health/version", destination: "/api/version" },
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
