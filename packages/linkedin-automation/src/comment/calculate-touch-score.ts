import levenshtein from "fast-levenshtein";

/**
 * Calculates the "Your Touch" score - how much the user has personalized an AI-generated comment.
 *
 * Uses a combination of metrics to give users credit for their edits:
 * 1. Base score: Levenshtein edit distance (character-level changes)
 * 2. LCS bonus: Low character sequence retention = user deleted/rewrote
 * 3. Word bonus: Low word overlap = user changed vocabulary
 * 4. Prefix bonus: Low prefix match = user rewrote from the beginning
 * 5. Addition bonus: User added their own content beyond the original
 *
 * The bonuses stack, making the algorithm generous to users who put in effort.
 *
 * @param original - The original AI-generated comment
 * @param current - The current comment text (after user edits)
 * @param previousHighScore - Optional: previous highest score (enables score floor - score never decreases)
 * @returns Score from 0-100 representing personalization percentage
 */
export function calculateTouchScore(
  original: string,
  current: string,
  previousHighScore?: number,
): number {
  // Edge cases
  if (!original && !current) return applyFloor(0, previousHighScore);
  if (original === current) return applyFloor(0, previousHighScore);
  if (!original && current) return 100; // User wrote from scratch
  if (original && !current) return 100; // User cleared everything

  // === BASE SCORE: Edit distance (current approach) ===
  const editDistance = levenshtein.get(original, current);
  const baseScore = (editDistance / original.length) * 100;

  // === BONUS 1: Low character retention (LCS) ===
  const lcsLength = longestCommonSubsequence(original, current);
  const charRetention = lcsLength / original.length;
  // If user kept <40% of original characters in order, give bonus
  const lcsBonus = charRetention < 0.4 ? (1 - charRetention) * 15 : 0;

  // === BONUS 2: Low word overlap ===
  const wordRetention = calculateWordRetention(original, current);
  // If user kept <40% of original words, give bonus
  const wordBonus = wordRetention < 0.4 ? (1 - wordRetention) * 15 : 0;

  // === BONUS 3: Rewrote from beginning (low prefix match) ===
  const prefixRatio = commonPrefixRatio(original, current);
  // If user changed the beginning (<30% prefix match), give bonus
  const prefixBonus = prefixRatio < 0.3 ? (1 - prefixRatio) * 10 : 0;

  // === BONUS 4: User added their own content (current is longer) ===
  // Rewards users for adding to the original rather than just editing
  const addedChars = Math.max(0, current.length - original.length);
  // Give ~2 points per 10% of original length added, up to 20 points
  const additionBonus = Math.min(20, (addedChars / original.length) * 20);

  // Stack all bonuses (max ~60 bonus points: 15 + 15 + 10 + 20)
  const totalBonus = lcsBonus + wordBonus + prefixBonus + additionBonus;

  const calculatedScore = Math.min(100, Math.round(baseScore + totalBonus));

  // Apply score floor if previousHighScore provided (score never decreases)
  return applyFloor(calculatedScore, previousHighScore);
}

/**
 * Applies score floor - returns max of calculated and previous high score.
 * This ensures score never decreases as user continues editing.
 */
function applyFloor(score: number, previousHighScore?: number): number {
  if (previousHighScore === undefined) return score;
  return Math.max(score, previousHighScore);
}

/**
 * Calculates the length of the Longest Common Subsequence (LCS) between two strings.
 * LCS finds the longest sequence of characters that appear in both strings in the same order
 * (but not necessarily contiguously).
 *
 * Uses space-optimized DP (O(n) space instead of O(n*m)).
 */
function longestCommonSubsequence(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Space optimization: only need previous row
  let prev = new Array<number>(n + 1).fill(0);
  let curr = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = (prev[j - 1] ?? 0) + 1;
      } else {
        curr[j] = Math.max(prev[j] ?? 0, curr[j - 1] ?? 0);
      }
    }
    // Swap rows
    [prev, curr] = [curr, prev];
  }

  return prev[n] ?? 0;
}

/**
 * Calculates what fraction of original words appear in the current text.
 * Uses simple word tokenization (split on whitespace).
 */
function calculateWordRetention(original: string, current: string): number {
  const originalWords = new Set(
    original
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0),
  );

  if (originalWords.size === 0) return 0;

  const currentWords = current
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const keptWords = currentWords.filter((w) => originalWords.has(w)).length;

  return keptWords / originalWords.size;
}

/**
 * Calculates what fraction of the original string is a common prefix with current.
 * Low ratio = user rewrote from the beginning.
 */
function commonPrefixRatio(original: string, current: string): number {
  if (original.length === 0) return 0;

  let i = 0;
  const minLen = Math.min(original.length, current.length);

  while (i < minLen && original[i] === current[i]) {
    i++;
  }

  return i / original.length;
}

/**
 * Helper to get score color based on touch score value.
 * Can be used for consistent UI coloring across components.
 */
export function getTouchScoreColor(score: number): string {
  if (score >= 50) return "text-green-600";
  if (score >= 20) return "text-amber-600";
  return "text-muted-foreground";
}
