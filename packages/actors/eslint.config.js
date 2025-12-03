import apify from "@apify/eslint-config/ts";
import prettier from "eslint-config-prettier";

import baseConfig from "@sassy/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [],
  },
  ...baseConfig,
  ...apify,
  {
    rules: {
      "simple-import-sort/imports": "off",
    },
  },
  prettier,
];
