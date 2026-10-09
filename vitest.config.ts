import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    exclude: ["e2e/**", "node_modules/**", "tests/rt-69-*.test.mjs"], // RT-69 suites run with node --test
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
