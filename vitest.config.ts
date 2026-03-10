import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        testTimeout: 10000, // 10 seconds
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(process.cwd()),
        },
    },
})
