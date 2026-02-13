/**
 * Schema Validators
 *
 * Re-exports auto-generated Zod schemas from Prisma + derived schemas for API use.
 * Prisma schema is the SINGLE SOURCE OF TRUTH.
 *
 * When adding a new field to settings:
 * 1. Add to Prisma schema
 * 2. Run `pnpm db:generate`
 * 3. Done! All types auto-update.
 */
import type { z } from "zod";

// Re-export all auto-generated schemas from Prisma
export * from "../generated/zod-prisma-validators";

// Import specific schemas for deriving upsert schemas
import {
  PostLoadSettingSchema,
  SubmitCommentSettingSchema,
  CommentGenerateSettingSchema,
  DiscoverySetSchema,
} from "../generated/zod-prisma-validators";

// =============================================================================
// DERIVED UPSERT SCHEMAS (for tRPC input validation)
// Excludes accountId (from context) and timestamps (auto-managed)
// =============================================================================

export const postLoadSettingUpsertSchema = PostLoadSettingSchema.omit({
  accountId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type PostLoadSettingUpsert = z.infer<typeof postLoadSettingUpsertSchema>;

export const submitCommentSettingUpsertSchema = SubmitCommentSettingSchema.omit(
  {
    accountId: true,
    createdAt: true,
    updatedAt: true,
  },
).partial();

export type SubmitCommentSettingUpsert = z.infer<
  typeof submitCommentSettingUpsertSchema
>;

export const commentGenerateSettingUpsertSchema =
  CommentGenerateSettingSchema.omit({
    accountId: true,
    createdAt: true,
    updatedAt: true,
  }).partial();

export type CommentGenerateSettingUpsert = z.infer<
  typeof commentGenerateSettingUpsertSchema
>;

// =============================================================================
// DERIVED PARTIAL TYPES (for queue/navigation state - excludes metadata fields)
// =============================================================================

export type PostLoadSettingsPartial = Omit<
  z.infer<typeof PostLoadSettingSchema>,
  "accountId" | "createdAt" | "updatedAt"
>;

export type CommentGenerateSettingsPartial = Omit<
  z.infer<typeof CommentGenerateSettingSchema>,
  "accountId" | "createdAt" | "updatedAt"
>;

// =============================================================================
// DISCOVERY SET SCHEMAS (for tRPC input validation)
// =============================================================================

/** Schema for creating a new DiscoverySet - omits id, accountId, timestamps */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
export const discoverySetCreateSchema = DiscoverySetSchema.omit({
  id: true,
  accountId: true,
  createdAt: true,
  updatedAt: true,
});

export type DiscoverySetCreate = z.infer<typeof discoverySetCreateSchema>;

/** Schema for updating a DiscoverySet - requires id, all other fields optional */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
export const discoverySetUpdateSchema = DiscoverySetSchema.pick({
  id: true,
  name: true,
  keywords: true,
  keywordsMode: true,
  excluded: true,
  authorJobTitle: true,
  authorIndustries: true,
}).partial().required({ id: true });

export type DiscoverySetUpdate = z.infer<typeof discoverySetUpdateSchema>;
