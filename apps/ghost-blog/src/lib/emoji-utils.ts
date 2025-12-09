import emojiFromText from "emoji-from-text";
import { get as getEmoji } from "node-emoji";

/**
 * Generates a relevant emoji from text using AI-powered emoji matching
 * @param text - The text to analyze for emoji generation
 * @param fallbackEmoji - The emoji to return if no match is found (default: "📄")
 * @returns A single emoji character
 */
export function generateEmojiFromText(
  text: string,
  fallbackEmoji: string = "📄",
): string {
  try {
    const result = emojiFromText(text, true);
    if (result?.match) {
      // Get the emoji shortcode (e.g., ":wave:") and convert to actual emoji
      const shortcode = result.match.toString();
      const emojiChar = getEmoji(shortcode);
      // Check if we got a valid emoji (node-emoji returns the shortcode back if not found)
      if (emojiChar && emojiChar !== shortcode) {
        return emojiChar;
      }
    }
  } catch (error) {
    console.warn("Failed to generate emoji from text:", text, error);
  }
  return fallbackEmoji;
}
