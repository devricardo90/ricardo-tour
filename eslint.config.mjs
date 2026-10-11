import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-prod/**", // isolated production build dir (NEXT_DIST_DIR, RT-44/RT-45 local audits)
    "out/**",
    "build/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
    ".e2e-data.json",
  ]),
]);

export default eslintConfig;
