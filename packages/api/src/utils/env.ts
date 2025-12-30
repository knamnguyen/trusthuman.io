import { z } from "zod";

export const env = z
  .object({
    LINKEDIN_PASSWORD_SECRET_KEY: z.string(),
    LINKEDIN_TWO_FA_SECRET_KEY: z.string(),
    HYPERBROWSER_API_KEY: z.string(),
    GOOGLE_GENAI_API_KEY: z.string(),
  })
  .parse(process.env);
