import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
    experimental: {
        authInterrupts: true,
        serverActions: {
            bodySizeLimit: "55mb",
        },
        optimizePackageImports: ["@prisma/client"],
    },
}

export default withNextIntl(nextConfig)
