import type { Config } from 'tailwindcss';
import baseConfig from '@sassy/tailwind-config/web';

export default {
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [baseConfig],
} satisfies Config;
