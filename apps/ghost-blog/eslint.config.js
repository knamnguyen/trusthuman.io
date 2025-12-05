import baseConfig from "@sassy/eslint-config/base";
import nextjsConfig from "@sassy/eslint-config/nextjs";
import reactConfig from "@sassy/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      ".turbo/**",
      "public/**",
    ],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
];
