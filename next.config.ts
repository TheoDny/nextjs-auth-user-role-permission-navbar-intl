const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin")
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

import { securityHeadersForNextConfig } from "./lib/security-headers"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
    experimental: {
        authInterrupts: true,
        serverActions: {
            bodySizeLimit: "55mb",
        },
        optimizePackageImports: ["@prisma/client"],
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: securityHeadersForNextConfig(),
            },
        ]
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.plugins = [...config.plugins, new PrismaPlugin()]
        }

        return config
    },
}

export default withNextIntl(nextConfig)
