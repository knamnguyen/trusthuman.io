/**
 * Email Analytics Utilities
 * Shared helper functions for weekly analytics email generation
 */

/**
 * Normalize date to start-of-day UTC (00:00:00)
 * Ensures consistent date format for composite unique constraint @@unique([accountId, date])
 *
 * @param date - Date object or ISO string (optional, defaults to today)
 * @returns Date object set to midnight UTC
 *
 * @example
 * normalizeToStartOfDay(new Date('2025-02-08T15:30:00Z')) // Returns 2025-02-08T00:00:00Z
 * normalizeToStartOfDay() // Returns today at 00:00:00Z
 */
export function normalizeToStartOfDay(date?: Date | string): Date {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Metric display names for user-facing text
 */
export const METRIC_DISPLAY_NAMES: Record<string, string> = {
  followers: "Followers",
  invites: "Invites",
  comments: "Comments",
  contentReach: "Content Reach",
  profileViews: "Profile Views",
  engageReach: "Engage Reach",
};

/**
 * Calculate percentage change from first to last value in array
 * Returns null if invalid data (division by zero, etc.)
 */
export function calculatePercentageChange(data: number[]): number | null {
  if (data.length < 2) return null;
  const first = data[0]!;
  const last = data[data.length - 1]!;
  if (first === 0) return last > 0 ? 100 : 0; // Avoid division by zero
  return Math.round(((last - first) / first) * 100);
}

/**
 * Format percentage change for display (e.g., "+14%" or "-8%")
 */
export function formatPercentageChange(change: number | null): string {
  if (change === null) return "0%";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change}%`;
}

/**
 * Format large numbers with abbreviations (e.g., 1000 → "1k", 1500 → "1.5k")
 * Matches the extension's display format
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    const value = num / 1000000;
    return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
  }
  if (num >= 1000) {
    const value = num / 1000;
    return value % 1 === 0 ? `${value}k` : `${value.toFixed(1)}k`;
  }
  return String(num);
}

/**
 * Find the top performing metric (highest positive growth)
 * Prioritizes positive growth, falls back to least negative if all are down
 */
export function findTopMetric(percentageChanges: Record<string, number | null>): {
  key: string;
  name: string;
  growth: number;
} {
  const entries = Object.entries(percentageChanges)
    .filter(([_, value]) => value !== null && !isNaN(value as number));

  if (entries.length === 0) {
    return { key: "followers", name: "Followers", growth: 0 };
  }

  // First, try to find metrics with positive growth
  const positiveEntries = entries
    .filter(([_, value]) => (value as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  if (positiveEntries.length > 0) {
    // Return highest positive growth
    const [key, growth] = positiveEntries[0]!;
    return {
      key,
      name: METRIC_DISPLAY_NAMES[key] || key,
      growth: growth as number,
    };
  }

  // If no positive growth, find the least negative (closest to 0)
  const sortedByValue = entries.sort((a, b) => (b[1] as number) - (a[1] as number));
  const [key, growth] = sortedByValue[0]!;
  return {
    key,
    name: METRIC_DISPLAY_NAMES[key] || key,
    growth: growth as number,
  };
}

/**
 * Subject line patterns based on Duolingo psychology strategy
 */
type SubjectCategory = "CELEBRATION" | "CHALLENGE" | "EMPATHY" | "URGENCY" | "MILESTONE" | "CURIOSITY" | "HUMOR" | "NEUTRAL";

export const SUBJECT_PATTERNS: Record<SubjectCategory, string[]> = {
  CELEBRATION: [
    "Congrats {firstName}, {change} this week! 🎉",
    "{firstName}, you're crushing it! {change} 🔥",
    "Amazing week, {firstName}! {change} 🚀",
    "{firstName}, new record! {change} 📈",
    "You're on fire, {firstName}! {change} 💪",
  ],
  CHALLENGE: [
    "Did you beat last week, {firstName}? 💪",
    "{firstName}, keep pushing! {change}",
    "Almost there, {firstName}! {change}",
    "Can you do better, {firstName}? {change}",
  ],
  EMPATHY: [
    "Don't be sad, {firstName}... {metric} {change}",
    "Tough week, {firstName}? {metric} down {changeAbs}%",
    "{firstName}, let's bounce back! {change} last week",
    "It happens, {firstName}. {change} this week",
  ],
  URGENCY: [
    "Uh oh, {firstName}. {metric} dropped {changeAbs}%",
    "{firstName}, we need to talk... {change} 📉",
    "Don't let it slide, {firstName}! {change}",
  ],
  MILESTONE: [
    "{firstName}, {total} LinkedIn wins this week!",
    "{total} activities! Keep going, {firstName}",
    "You hit {followers} followers, {firstName}! 🎯",
  ],
  CURIOSITY: [
    "{firstName}, you won't believe this... 👀",
    "Interesting week, {firstName} 🤔",
    "{firstName}, check this out...",
    "Hmm, {firstName}. Interesting. 💭",
  ],
  HUMOR: [
    "{firstName}, LinkedIn ghost mode? 👻",
    "Did LinkedIn break, {firstName}? 🤷",
    "Still alive, {firstName}? 😴",
    "{firstName}, your LinkedIn needs you! 💼",
  ],
  NEUTRAL: [
    "{firstName}'s LinkedIn stats 📊",
    "This week's report, {firstName} 📈",
    "Stats are in, {firstName}! 🎯",
  ],
};

/**
 * Select subject line category based on growth and activity
 */
function selectSubjectCategory(growth: number, totalActivities: number): SubjectCategory {
  if (growth >= 20) return "CELEBRATION";
  if (growth >= 5 && growth < 20) return "CHALLENGE";
  if (growth < 0 && growth >= -20) return "EMPATHY";
  if (growth < -20) return "URGENCY";
  if (totalActivities >= 50) return "MILESTONE";
  if (Math.abs(growth) <= 5) return "CURIOSITY";
  if (totalActivities < 10) return "HUMOR";
  return "NEUTRAL";
}

/**
 * Generate dynamic subject line with psychology patterns
 */
export function generateSubjectLine(
  firstName: string,
  topMetric: { name: string; growth: number },
  totalActivities: number,
  followers: number,
): string {
  const category = selectSubjectCategory(topMetric.growth, totalActivities);
  const patterns = SUBJECT_PATTERNS[category];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)]!;

  const change = formatPercentageChange(topMetric.growth);
  const changeAbs = Math.abs(topMetric.growth);

  return pattern
    .replace(/{firstName}/g, firstName)
    .replace(/{change}/g, change)
    .replace(/{changeAbs}/g, String(changeAbs))
    .replace(/{metric}/g, topMetric.name)
    .replace(/{total}/g, String(totalActivities))
    .replace(/{followers}/g, String(followers));
}

/**
 * Chart colors for each metric
 */
export const CHART_COLORS = {
  followers: { border: "#1b9aaa", background: "rgba(27, 154, 170, 0.1)" },
  invites: { border: "#308169", background: "rgba(48, 129, 105, 0.1)" },
  comments: { border: "#ffc63d", background: "rgba(255, 198, 61, 0.1)" },
  contentReach: { border: "#ed6b67", background: "rgba(237, 107, 103, 0.1)" },
  profileViews: { border: "#e5496d", background: "rgba(229, 73, 109, 0.1)" },
  engageReach: { border: "#9b59b6", background: "rgba(155, 89, 182, 0.1)" },
};

/**
 * Generate QuickChart.io chart URL for 7-day analytics visualization
 * Increased dimensions for better readability
 *
 * @param data - 7-day data arrays for each metric
 * @param labels - Date labels for the X-axis
 * @returns Encoded QuickChart.io URL
 */
export function generateChartUrl(data: {
  followers: number[];
  invites: number[];
  comments: number[];
  contentReach: number[];
  profileViews: number[];
  engageReach: number[];
  labels: string[];
}): string {
  // Define all metrics with their styling
  const metrics = [
    {
      key: "followers",
      label: "Followers",
      data: data.followers,
      borderColor: CHART_COLORS.followers.border,
      backgroundColor: CHART_COLORS.followers.background,
    },
    {
      key: "invites",
      label: "Invites",
      data: data.invites,
      borderColor: CHART_COLORS.invites.border,
      backgroundColor: CHART_COLORS.invites.background,
    },
    {
      key: "comments",
      label: "Comments",
      data: data.comments,
      borderColor: CHART_COLORS.comments.border,
      backgroundColor: CHART_COLORS.comments.background,
    },
    {
      key: "contentReach",
      label: "Content Reach",
      data: data.contentReach,
      borderColor: CHART_COLORS.contentReach.border,
      backgroundColor: CHART_COLORS.contentReach.background,
    },
    {
      key: "profileViews",
      label: "Profile Views",
      data: data.profileViews,
      borderColor: CHART_COLORS.profileViews.border,
      backgroundColor: CHART_COLORS.profileViews.background,
    },
    {
      key: "engageReach",
      label: "Engage Reach",
      data: data.engageReach,
      borderColor: CHART_COLORS.engageReach.border,
      backgroundColor: CHART_COLORS.engageReach.background,
    },
  ];

  // Find the top metric (highest max value) for data label display
  const topMetricKey = metrics.reduce((topKey, metric) => {
    const currentMax = Math.max(...metric.data);
    const topMax = Math.max(...metrics.find((m) => m.key === topKey)!.data);
    return currentMax > topMax ? metric.key : topKey;
  }, metrics[0]!.key);

  // Build datasets - show data labels only on top metric
  const datasets = metrics.map((metric) => ({
    label: metric.label,
    data: metric.data,
    borderColor: metric.borderColor,
    backgroundColor: metric.backgroundColor,
    borderWidth: 6,
    tension: 0.3,
    pointRadius: 10,
    datalabels:
      metric.key === topMetricKey
        ? {
            display: true,
            anchor: "end",
            align: "top",
            offset: 8,
            font: { size: 24, weight: "bold" },
            color: metric.borderColor,
          }
        : { display: false },
  }));

  const chartConfig = {
    type: "line",
    data: {
      labels: data.labels,
      datasets,
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            font: { size: 360 },
            padding: 100,
            boxWidth: 200,
          },
        },
        datalabels: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 300 } },
        },
        x: {
          ticks: { font: { size: 300 } },
        },
      },
    },
  };

  // Using devicePixelRatio=0.5 to make fonts appear larger relative to the chart
  return `https://quickchart.io/chart?width=800&height=400&devicePixelRatio=0.5&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
}

/**
 * Meme templates and messages for dynamic meme generation
 * Uses memegen.link API (free, open source, no rate limits documented)
 */
type MemeCategory = "CELEBRATION" | "GROWTH" | "DECLINE" | "STEADY" | "COMEBACK";

interface MemeTemplate {
  template: string; // memegen template name
  topText: string;
  bottomText: string;
}

export const MEME_TEMPLATES: Record<MemeCategory, MemeTemplate[]> = {
  CELEBRATION: [
    { template: "success", topText: "{name}_crushed_it!", bottomText: "{change}_growth_this_week" },
    { template: "awesome", topText: "You're_doing", bottomText: "amazing_{name}!" },
    { template: "buzz", topText: "{metric}_gains", bottomText: "{metric}_gains_everywhere" },
    { template: "leo", topText: "{name}", bottomText: "killing_it_on_LinkedIn" },
    { template: "morpheus", topText: "What_if_I_told_you", bottomText: "{name}_is_LinkedIn_famous" },
  ],
  GROWTH: [
    { template: "doge", topText: "Much_{metric}", bottomText: "Very_growth._Wow." },
    { template: "gandalf", topText: "A_{metric}_never_stops", bottomText: "It_grows_precisely_as_intended" },
    { template: "woody", topText: "{metric}", bottomText: "{metric}_everywhere" },
    { template: "stonks", topText: "{name}", bottomText: "{change}_{metric}" },
    { template: "fry", topText: "Not_sure_if_lucky", bottomText: "Or_just_that_good" },
  ],
  DECLINE: [
    { template: "fine", topText: "{name}_this_week", bottomText: "This_is_fine" },
    { template: "firstworld", topText: "My_{metric}_dropped", bottomText: "By_{changeAbs}_percent" },
    { template: "sadkeanu", topText: "When_{metric}", bottomText: "goes_down_{changeAbs}%" },
    { template: "hide", topText: "{name}_checking", bottomText: "LinkedIn_stats" },
  ],
  STEADY: [
    { template: "interesting", topText: "Interesting", bottomText: "Tell_me_more_about_{metric}" },
    { template: "joker", topText: "It's_not_about_the_{metric}", bottomText: "It's_about_consistency" },
    { template: "spongebob", topText: "{name}", bottomText: "Steady_wins_the_race" },
  ],
  COMEBACK: [
    { template: "alive", topText: "Rumors_of_my", bottomText: "LinkedIn_death_were_exaggerated" },
    { template: "sparta", topText: "This_is", bottomText: "A_COMEBACK!" },
    { template: "icanhas", topText: "I_can_has", bottomText: "{metric}_recovery~q" },
  ],
};

/**
 * Encode text for memegen.link URL
 * Spaces → _, special chars → URL encoded
 */
export function encodeMemeText(text: string): string {
  return text
    .replace(/ /g, "_")
    .replace(/%/g, "~p")
    .replace(/\?/g, "~q")
    .replace(/#/g, "~h")
    .replace(/\//g, "~s")
    .replace(/"/g, "''")
    .replace(/-/g, "--");
}

/**
 * Generate dynamic meme URL based on user performance
 */
export function generateMemeUrl(
  firstName: string,
  topMetric: { name: string; growth: number },
): string {
  // Determine category based on growth
  let category: MemeCategory;
  if (topMetric.growth >= 20) {
    category = "CELEBRATION";
  } else if (topMetric.growth >= 5) {
    category = "GROWTH";
  } else if (topMetric.growth < -10) {
    category = "DECLINE";
  } else if (topMetric.growth < 0 && topMetric.growth >= -10) {
    category = "COMEBACK"; // Small decline = opportunity for comeback
  } else {
    category = "STEADY";
  }

  // Random selection from category
  const templates = MEME_TEMPLATES[category];
  const selected = templates[Math.floor(Math.random() * templates.length)]!;

  // Replace placeholders
  const change = topMetric.growth >= 0 ? `+${topMetric.growth}%` : `${topMetric.growth}%`;
  const changeAbs = Math.abs(topMetric.growth);

  const topText = encodeMemeText(
    selected.topText
      .replace(/{name}/g, firstName)
      .replace(/{metric}/g, topMetric.name)
      .replace(/{change}/g, change)
      .replace(/{changeAbs}/g, String(changeAbs)),
  );

  const bottomText = encodeMemeText(
    selected.bottomText
      .replace(/{name}/g, firstName)
      .replace(/{metric}/g, topMetric.name)
      .replace(/{change}/g, change)
      .replace(/{changeAbs}/g, String(changeAbs)),
  );

  return `https://api.memegen.link/images/${selected.template}/${topText}/${bottomText}.png`;
}

/**
 * Pad data arrays to 7 days by repeating the first value for missing days
 * Handles cases where users have less than 7 days of data
 *
 * @param data - Array of data points (1-7 values)
 * @returns Array padded to exactly 7 values
 */
export function padToSevenDays<T>(data: T[]): T[] {
  if (data.length === 7) return data;
  if (data.length === 0) return Array(7).fill(0 as T);

  // Pad by repeating the first value for earlier days
  const paddingNeeded = 7 - data.length;
  const padding = Array(paddingNeeded).fill(data[0]);
  return [...padding, ...data];
}

/**
 * Generate date labels for the last 7 days
 * If fewer labels provided, generates labels for earlier days
 *
 * @param labels - Existing labels (1-7 values)
 * @returns Array of 7 date labels
 */
export function padDateLabels(labels: string[]): string[] {
  if (labels.length === 7) return labels;

  // Generate missing labels by going back in time
  const paddingNeeded = 7 - labels.length;
  const missingLabels: string[] = [];

  // Parse the earliest date and go backwards
  // For simplicity, just use generic labels like "Day -6", "Day -5", etc.
  for (let i = paddingNeeded; i > 0; i--) {
    missingLabels.push(`-${i}d`);
  }

  return [...missingLabels, ...labels];
}
