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
    "fix*.js",
    "generateProperties.js",
    "pw-sidebar-*.tmp.js",
  ]),
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
