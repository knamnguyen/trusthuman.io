import { collectPostsBatch } from "@sassy/linkedin-automation/feed/collect-posts";
import { createFeedUtilities } from "@sassy/linkedin-automation/feed/create-feed-utilities";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

async function retry<TOutput>(
  fn: () => TOutput,
  opts?: {
    timeout?: number;
    interval?: number;
    retryOn?: (output: TOutput) => boolean;
  },
) {
  const { timeout = 10000, interval = 200 } = opts ?? {};
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await Promise.resolve(fn());

      return {
        ok: true as const,
        data: result,
      };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, interval));
      // ignore
    }
  }

  return {
    ok: false as const,
    error: new Error("timeout"),
  };
}

function parsePostTime(input: {
  type: "full" | "display";
  value: string;
}): Date {
  const now = new Date();

  // Helper to subtract time from the current date
  function subtractTime(
    amount: number,
    unit: "second" | "minute" | "hour" | "day" | "week",
  ) {
    const d = new Date(now);
    switch (unit) {
      case "second":
        d.setSeconds(d.getSeconds() - amount);
        break;
      case "minute":
        d.setMinutes(d.getMinutes() - amount);
        break;
      case "hour":
        d.setHours(d.getHours() - amount);
        break;
      case "day":
        d.setDate(d.getDate() - amount);
        break;
      case "week":
        d.setDate(d.getDate() - amount * 7);
        break;
    }
    return d;
  }
  switch (input.type) {
    case "display": {
      const match = /^(\d+)([smhdw])$/i.exec(input.value);
      if (!match) return now; // fallback if no match

      const [, amountStr, unitChar] = match;
      if (amountStr === undefined || unitChar === undefined) {
        return now;
      }

      const amount = parseInt(amountStr, 10);
      switch (unitChar.toLowerCase()) {
        case "s":
          return subtractTime(amount, "second");
        case "m":
          return subtractTime(amount, "minute");
        case "h":
          return subtractTime(amount, "hour");
        case "d":
          return subtractTime(amount, "day");
        case "w":
          return subtractTime(amount, "week");
        default:
          return now;
      }
    }
    case "full": {
      const match =
        /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s+ago/i.exec(
          input.value,
        );
      if (!match) return now;

      const [, amountStr, unit] = match;
      if (amountStr === undefined || unit === undefined) {
        return now;
      }
      const amount = parseInt(amountStr, 10);
      switch (unit.toLowerCase()) {
        case "second":
          return subtractTime(amount, "second");
        case "minute":
          return subtractTime(amount, "minute");
        case "hour":
          return subtractTime(amount, "hour");
        case "day":
          return subtractTime(amount, "day");
        case "week":
          return subtractTime(amount, "week");
        case "month": {
          const d = new Date(now);
          d.setMonth(d.getMonth() - amount);
          return d;
        }
        case "year": {
          const d = new Date(now);
          d.setFullYear(d.getFullYear() - amount);
          return d;
        }
        default:
          return now;
      }
    }
    default:
      return now;
  }
}

const engagekitInternals = {
  retry,
  collectPostsBatch,
  parsePostTime,
  feedUtilities: createFeedUtilities(),
  postUtilities: createPostUtilities(),
};

function inject() {
  if (typeof window === "undefined") {
    // just return if this file was somehow imported in a non-browser context
    console.error("EngageKit: window is undefined, cannot inject internals");
    return;
  }

  window.engagekitInternals = engagekitInternals;
}

inject();

export type EngagekitInternals = typeof engagekitInternals;

declare const window: Window & {
  engagekitInternals: EngagekitInternals;
};
