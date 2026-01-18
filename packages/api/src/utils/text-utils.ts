/**
 * Text utility functions for AI service.
 */

/**
 * Truncate text to a maximum number of words.
 * If truncated, appends "..." to indicate continuation.
 *
 * @param text - The text to truncate
 * @param maxWords - Maximum number of words to keep
 * @returns Truncated text with "..." if needed
 */
export function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  if (words.length <= maxWords) {
    return text.trim();
  }

  return words.slice(0, maxWords).join(" ") + "...";
}
