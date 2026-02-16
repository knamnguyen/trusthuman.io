/**
 * API Types
 *
 * Import and re-export types from the API package for use in Chrome extension
 */

// Import AppRouter type from the API package using sassy scoped import
export type { AppRouter } from "@sassy/api";

// Import schema types that might be useful for the extension
export type {
  CommentGenerationInput,
  CommentGenerationOutput,
  CommentGeneratorConfig,
  CommentGeneratorError,
} from "@sassy/api";
