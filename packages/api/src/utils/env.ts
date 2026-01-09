import { z } from "zod";

export const env = z
  .object({
    LINKEDIN_PASSWORD_SECRET_KEY: z.string(),
    LINKEDIN_TWO_FA_SECRET_KEY: z.string(),
    HYPERBROWSER_API_KEY: z.string(),
    GOOGLE_GENAI_API_KEY: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    CLERK_WEBHOOK_SECRET: z.string(),
    CLERK_SECRET_KEY: z.string(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  })
  .parse(process.env);
