import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/vendor/**",
    "scripts/legacy/**",
    "pw-sidebar-*.tmp.js",
    // The backend (NestJS) repo, cloned in-place at the project root —
    // its own separate toolchain/lint setup, not this frontend's.
    "huza-estate-b/**",
  ]),
  {
    files: ["tests/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["src/components/PropertiesMap.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/app/buy/page.tsx", "src/app/sell/page.tsx", "src/app/mortgages/page.tsx"],
    rules: { "react/no-unescaped-entities": "off" },
  },
]);

export default eslintConfig;
