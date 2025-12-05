import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

import baseConfig from "@sassy/tailwind-config/web";

export default {
  // We need to append the path to the UI package and components/tools to the content array
  content: [
    ...baseConfig.content,
    "../../packages/ui/src/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
    },
  },
} satisfies Config;
