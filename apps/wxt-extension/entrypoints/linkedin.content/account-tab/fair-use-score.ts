/**
 * Warm-Up Based Fair Use Score Algorithm
 *
 * This algorithm considers the user's historical commenting patterns to determine
 * safe activity levels. Key principle: an account that has been consistently active
 * at 80 comments/day for weeks can safely continue at 80, while an account that
 * was dormant and suddenly starts commenting needs to warm up slowly.
 */

export interface FairUseAnalysis {
  /** Overall score */
  score: "safe" | "warning" | "danger";
  /** Detected account phase */
  phase: AccountPhase;
  /** Recommended daily comment range */
  recommendedRange: { min: number; max: number };
  /** Current daily average (last 3 days) */
  recentAverage: number;
  /** Baseline average (days 4-14) */
  baselineAverage: number;
  /** Max daily count in period */
  maxDaily: number;
  /** Number of consecutive active days */
  consecutiveActiveDays: number;
  /** Primary message to display */
  message: string;
  /** Detailed explanation */
  details: string[];
  /** Specific warnings */
  warnings: string[];
}

export type AccountPhase =
  | "dormant"
  | "returning"
  | "warming"
  | "growing"
  | "established"
  | "power_user";

interface DailyCount {
  date: string;
  count: number;
}

/**
 * Analyze comment history and produce a fair use score with recommendations
 */
export function analyzeFairUse(
  dailyCounts: Record<string, number>,
): FairUseAnalysis {
  // Sort by date descending (most recent first)
  const sorted = Object.entries(dailyCounts)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, count]) => ({ date, count }));

  if (sorted.length === 0) {
    return createDormantAnalysis();
  }

  // Calculate metrics
  const recent3Days = sorted.slice(0, 3);
  const baseline = sorted.slice(3, 14); // Days 4-14
  const olderBaseline = sorted.slice(7, 21); // Days 8-21 for longer trend

  const recentAverage = average(recent3Days.map((d) => d.count));
  const baselineAverage = average(baseline.map((d) => d.count));
  const olderBaselineAverage = average(olderBaseline.map((d) => d.count));
  const overallAverage = average(sorted.map((d) => d.count));
  const maxDaily = Math.max(...sorted.map((d) => d.count));

  // Count consecutive active days (at least 1 comment)
  const consecutiveActiveDays = countConsecutiveActiveDays(sorted);

  // Detect account phase
  const phase = detectPhase(
    overallAverage,
    consecutiveActiveDays,
    sorted.length,
  );

  // Get recommended range for this phase
  const recommendedRange = getRecommendedRange(phase, baselineAverage);

  // Analyze for warnings and score
  const warnings: string[] = [];
  let score: "safe" | "warning" | "danger" = "safe";

  // Rule 1: Spike detection (recent vs baseline)
  if (baselineAverage > 0) {
    const spikeRatio = recentAverage / baselineAverage;
    if (spikeRatio > 2) {
      warnings.push(
        `Activity spike detected: Recent avg (${Math.round(recentAverage)}) is ${spikeRatio.toFixed(1)}x your baseline (${Math.round(baselineAverage)})`,
      );
      score = "danger";
    } else if (spikeRatio > 1.5) {
      warnings.push(
        `Ramping up fast: Recent avg (${Math.round(recentAverage)}) is ${spikeRatio.toFixed(1)}x your baseline`,
      );
      score = score === "danger" ? "danger" : "warning";
    }
  }

  // Rule 2: Fake warm-up detection (high recent + low baseline)
  if (recentAverage >= 40 && baselineAverage <= 20 && baselineAverage > 0) {
    warnings.push(
      `Sudden increase: You jumped from ~${Math.round(baselineAverage)}/day to ~${Math.round(recentAverage)}/day too quickly`,
    );
    score = "danger";
  }

  // Rule 3: Dormant account suddenly active
  if (
    phase === "dormant" ||
    (phase === "returning" && recentAverage > 20)
  ) {
    if (recentAverage > 15) {
      warnings.push(
        `Account was dormant. Start with 10-15 comments/day and increase gradually.`,
      );
      score = score === "danger" ? "danger" : "warning";
    }
  }

  // Rule 4: Approaching LinkedIn hard limit
  if (maxDaily >= 100) {
    warnings.push(
      `Exceeded 100 comments in a day - this is LinkedIn's detection threshold`,
    );
    score = "danger";
  } else if (maxDaily >= 80) {
    warnings.push(
      `Approaching 100/day limit. Even established accounts should stay under 80.`,
    );
    score = score === "danger" ? "danger" : "warning";
  }

  // Rule 5: Check if recent activity exceeds recommended range
  if (recentAverage > recommendedRange.max * 1.3) {
    warnings.push(
      `Current activity (~${Math.round(recentAverage)}/day) exceeds safe range for your account phase`,
    );
    score = "danger";
  } else if (recentAverage > recommendedRange.max) {
    warnings.push(
      `Consider slowing down to ${recommendedRange.min}-${recommendedRange.max}/day based on your history`,
    );
    score = score === "danger" ? "danger" : "warning";
  }

  // Rule 6: Spikiness within the period
  if (maxDaily > 0 && overallAverage > 0) {
    const spikinessRatio = maxDaily / overallAverage;
    if (spikinessRatio > 4) {
      warnings.push(
        `Very spiky pattern: Max day (${maxDaily}) is ${spikinessRatio.toFixed(1)}x your average`,
      );
      score = "danger";
    } else if (spikinessRatio > 3) {
      warnings.push(
        `Inconsistent pattern: Try to spread activity more evenly across days`,
      );
      score = score === "danger" ? "danger" : "warning";
    }
  }

  // Generate message based on phase and score
  const message = generateMessage(phase, score, recommendedRange, warnings);
  const details = generateDetails(
    phase,
    consecutiveActiveDays,
    recentAverage,
    baselineAverage,
    recommendedRange,
  );

  return {
    score,
    phase,
    recommendedRange,
    recentAverage: Math.round(recentAverage),
    baselineAverage: Math.round(baselineAverage),
    maxDaily,
    consecutiveActiveDays,
    message,
    details,
    warnings,
  };
}

function createDormantAnalysis(): FairUseAnalysis {
  return {
    score: "safe",
    phase: "dormant",
    recommendedRange: { min: 10, max: 15 },
    recentAverage: 0,
    baselineAverage: 0,
    maxDaily: 0,
    consecutiveActiveDays: 0,
    message: "No recent activity. Start slow with 10-15 comments/day.",
    details: [
      "Account appears dormant or new",
      "Warm up slowly over 2-3 weeks",
      "Week 1: 10-15/day, Week 2: 20-30/day, Week 3: 30-40/day",
    ],
    warnings: [],
  };
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function countConsecutiveActiveDays(sorted: DailyCount[]): number {
  let count = 0;
  for (const day of sorted) {
    if (day.count >= 1) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function detectPhase(
  overallAverage: number,
  consecutiveActiveDays: number,
  totalDays: number,
): AccountPhase {
  // Power User: 60+ avg for 21+ consecutive days
  if (overallAverage >= 60 && consecutiveActiveDays >= 21) {
    return "power_user";
  }

  // Established: 40+ avg for 14+ consecutive days
  if (overallAverage >= 40 && consecutiveActiveDays >= 14) {
    return "established";
  }

  // Growing: 20+ avg for 7+ consecutive days
  if (overallAverage >= 20 && consecutiveActiveDays >= 7) {
    return "growing";
  }

  // Warming: 10+ avg with some consecutive days
  if (overallAverage >= 10 && consecutiveActiveDays >= 3) {
    return "warming";
  }

  // Returning: Some activity but not consistent
  if (overallAverage >= 5 || consecutiveActiveDays >= 1) {
    return "returning";
  }

  // Dormant: Very little or no activity
  return "dormant";
}

function getRecommendedRange(
  phase: AccountPhase,
  baselineAverage: number,
): { min: number; max: number } {
  switch (phase) {
    case "dormant":
      return { min: 10, max: 15 };
    case "returning":
      return { min: 10, max: 20 };
    case "warming":
      return { min: 15, max: 30 };
    case "growing":
      return { min: 30, max: 45 };
    case "established":
      // Use baseline as guide, but cap at safe limits
      const establishedMax = Math.min(Math.max(baselineAverage * 1.1, 50), 70);
      return { min: 40, max: Math.round(establishedMax) };
    case "power_user":
      // Power users can go higher, but still cap
      const powerMax = Math.min(Math.max(baselineAverage * 1.1, 60), 90);
      return { min: 50, max: Math.round(powerMax) };
    default:
      return { min: 10, max: 20 };
  }
}

function generateMessage(
  phase: AccountPhase,
  score: "safe" | "warning" | "danger",
  range: { min: number; max: number },
  warnings: string[],
): string {
  if (score === "danger") {
    return warnings[0] || "High risk of detection - reduce activity immediately";
  }

  if (score === "warning") {
    return warnings[0] || "Approaching limits - consider slowing down";
  }

  // Safe messages by phase
  switch (phase) {
    case "dormant":
      return "Start slow: 10-15 comments/day recommended";
    case "returning":
      return "Welcome back! Ease in with 10-20 comments/day";
    case "warming":
      return `Good warm-up progress! Safe range: ${range.min}-${range.max}/day`;
    case "growing":
      return `Building momentum. Safe range: ${range.min}-${range.max}/day`;
    case "established":
      return `Established pattern. Safe range: ${range.min}-${range.max}/day`;
    case "power_user":
      return `Consistent history. Safe range: ${range.min}-${range.max}/day`;
    default:
      return `Recommended: ${range.min}-${range.max} comments/day`;
  }
}

function generateDetails(
  phase: AccountPhase,
  consecutiveDays: number,
  recentAvg: number,
  baselineAvg: number,
  range: { min: number; max: number },
): string[] {
  const details: string[] = [];

  // Phase info
  const phaseLabels: Record<AccountPhase, string> = {
    dormant: "Dormant/New Account",
    returning: "Returning User",
    warming: "Warming Up",
    growing: "Growing Activity",
    established: "Established Account",
    power_user: "Power User",
  };
  details.push(`Phase: ${phaseLabels[phase]}`);

  if (consecutiveDays > 0) {
    details.push(`Consecutive active days: ${consecutiveDays}`);
  }

  if (recentAvg > 0) {
    details.push(`Recent avg (3d): ${Math.round(recentAvg)}/day`);
  }

  if (baselineAvg > 0) {
    details.push(`Baseline avg: ${Math.round(baselineAvg)}/day`);
  }

  details.push(`Safe range: ${range.min}-${range.max}/day`);

  return details;
}

/**
 * Phase-specific guidance for warm-up
 */
export function getWarmUpGuidance(phase: AccountPhase): string[] {
  switch (phase) {
    case "dormant":
      return [
        "Week 1: 10-15 comments/day",
        "Week 2: 15-25 comments/day",
        "Week 3: 25-35 comments/day",
        "Week 4+: 35-50 comments/day",
      ];
    case "returning":
      return [
        "Days 1-3: 10-20 comments/day",
        "Days 4-7: 20-30 comments/day",
        "Week 2: 30-40 comments/day",
      ];
    case "warming":
      return [
        "Continue current pace for 3-5 more days",
        "Then increase by 5-10/day each week",
        "Target: 40-50/day after 2-3 weeks",
      ];
    case "growing":
      return [
        "Good progress! Maintain for another week",
        "Can increase to 45-55/day next week",
        "Stay consistent - avoid spikes",
      ];
    case "established":
      return [
        "You've built a solid baseline",
        "Stay within 20% of your average",
        "Avoid sudden increases above 70/day",
      ];
    case "power_user":
      return [
        "Strong consistent history",
        "Stay under 100/day absolute max",
        "Keep patterns natural - vary timing",
      ];
    default:
      return ["Start slow and build gradually"];
  }
}
