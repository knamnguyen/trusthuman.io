import type { Config } from "tailwindcss";

import baseConfig from "@sassy/tailwind-config/web";

export default {
  content: [
    ...baseConfig.content,
    "../../packages/ui/src/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx,html}",
  ],
  presets: [baseConfig],
} satisfies Config;
