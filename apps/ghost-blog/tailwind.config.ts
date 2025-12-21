import type { Config } from "tailwindcss";

import baseConfig from "@sassy/tailwind-config/web";

export default {
  // We need to append the path to the UI package and components/tools to the content array
  content: [
    ...baseConfig.content,
    "../../packages/ui/src/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
} satisfies Config;
