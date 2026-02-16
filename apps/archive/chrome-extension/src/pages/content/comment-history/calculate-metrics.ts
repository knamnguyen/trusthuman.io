/**
 * Metrics calculation for LinkedIn comment history
 */

import {
  formatDate,
  getFeedLis,
  getImpressions,
  getTime,
  parseLinkedInTime,
} from "./extract-linkedin-data";

export interface CommentMetrics {
  count: number;
  totalImpressions: number;
  minDate: Date | null;
  maxDate: Date | null;
}

/**
 * Calculates metrics for all loaded comments
 */
export function calculateMetrics(): CommentMetrics {
  const lis = getFeedLis();
  let count = 0;
  let totalImpressions = 0;
  const times: Date[] = [];

  for (const li of lis) {
    const timeText = getTime(li);
    if (!timeText) continue;

    count++;
    totalImpressions += getImpressions(li);
    times.push(parseLinkedInTime(timeText));
  }

  const validTimes = times.filter(Boolean);
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  if (validTimes.length > 0) {
    minDate = new Date(Math.min(...validTimes.map((d) => d.getTime())));
    maxDate = new Date(Math.max(...validTimes.map((d) => d.getTime())));
  }

  return {
    count,
    totalImpressions,
    minDate,
    maxDate,
  };
}

/**
 * Updates the metrics display elements
 */
export function updateMetrics(
  countSpan: HTMLElement,
  impressionsSpan: HTMLElement,
  dateSpan: HTMLElement,
): void {
  const metrics = calculateMetrics();

  countSpan.innerHTML = `Comments: <span style="font-size: 32px; font-weight: 900;">${metrics.count}</span>`;
  impressionsSpan.innerHTML = `Impressions: <span style="font-size: 32px; font-weight: 900;">${metrics.totalImpressions.toLocaleString()}</span>`;
  dateSpan.textContent = `${formatDate(metrics.minDate)} - ${formatDate(metrics.maxDate)}`;
}
