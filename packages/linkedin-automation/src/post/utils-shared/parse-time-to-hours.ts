/**
 * Parse Time to Hours - Shared Utility
 *
 * Converts LinkedIn time display strings to hours for age filtering.
 * Used with extractPostTime().displayTime output.
 */

/**
 * Converts a LinkedIn time display string to hours.
 *
 * LinkedIn time units:
 * - "m" = minutes (e.g., "17m" = 17 minutes ago)
 * - "h" = hours (e.g., "21h" = 21 hours ago)
 * - "d" = days (e.g., "2d" = 2 days ago)
 * - "w" = weeks (e.g., "1w" = 1 week ago)
 * - "mo" = months (e.g., "3mo" = 3 months ago)
 * - "y" = years (e.g., "1y" = 1 year ago)
 *
 * @param displayTime - Time string from extractPostTime() (e.g., "21h", "2d", "1w", "3mo")
 * @returns Number of hours, or null if parsing fails
 *
 * @example
 * parseTimeToHours("17m") // 0.28 (17 minutes)
 * parseTimeToHours("21h") // 21
 * parseTimeToHours("2d")  // 48
 * parseTimeToHours("1w")  // 168
 * parseTimeToHours("3mo") // 2190
 */
export function parseTimeToHours(displayTime: string | null): number | null {
  if (!displayTime) return null;

  // Match number followed by unit (e.g., "17m", "21h", "2d", "1w", "3mo", "1y")
  const match = displayTime.match(/^(\d+)\s*([hdwmoy]+)/i);
  if (!match?.[1] || !match[2]) return null;

  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  // IMPORTANT: Order matters - check "mo" before "m"
  // LinkedIn uses "m" for minutes, "mo" for months
  const hoursPerUnit: Record<string, number> = {
    m: 1 / 60, // minutes to hours
    h: 1,
    d: 24,
    w: 168, // 7 * 24
    mo: 730, // ~30.4 * 24 (months)
    y: 8760, // 365 * 24
  };

  const multiplier = hoursPerUnit[unit];
  if (multiplier === undefined) return null;

  return num * multiplier;
}
