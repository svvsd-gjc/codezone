import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx,js}", "**/__tests__/**/*.test.{ts,tsx,js}"],
    exclude: ["node_modules", ".next", "cypress", "cli"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["pages/api/**", "src/**", "components/**"],
      exclude: ["**/*.d.ts", "cypress/**", "cli/**"],
      thresholds: {
        lines: 40,
        branches: 40,
        functions: 40,
        statements: 40,
      },
    },
  },
});
