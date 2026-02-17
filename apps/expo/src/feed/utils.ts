/** Get initials from a full name (e.g. "Sarah Chen" → "SC") */
export function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() ?? "?";
  return (
    (parts[0]?.charAt(0) ?? "") + (parts[parts.length - 1]?.charAt(0) ?? "")
  ).toUpperCase();
}

/**
 * Tailwind color class for touch score thresholds.
 * - >= 70: green (highly personalized)
 * - >= 30: yellow (moderate)
 * - < 30: red (mostly AI-generated)
 */
export function getTouchScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 30) return "text-yellow-600";
  return "text-red-500";
}

/**
 * Simple relative time formatter (avoids adding date-fns as a dependency).
 * Produces strings like "2 hours ago", "about 1 day ago".
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `about ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "about 1 day ago";
  return `about ${days} days ago`;
}
