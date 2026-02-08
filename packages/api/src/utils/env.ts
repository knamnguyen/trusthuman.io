import { z } from "zod";

const envSchema = z.object({
  LINKEDIN_PASSWORD_SECRET_KEY: z.string(),
  LINKEDIN_TWO_FA_SECRET_KEY: z.string(),
  HYPERBROWSER_API_KEY: z.string(),
  GOOGLE_GENAI_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),
  CLERK_SECRET_KEY: z.string(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  LOOPS_API_KEY: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://app.engagekit.io"),
});

// Skip validation during build/CI - env vars are only needed at runtime
const skipValidation =
  !!process.env.CI ||
  !!process.env.SKIP_ENV_VALIDATION ||
  process.env.npm_lifecycle_event === "lint";

export const env = skipValidation
  ? (process.env as unknown as z.infer<typeof envSchema>)
  : envSchema.parse(process.env);
