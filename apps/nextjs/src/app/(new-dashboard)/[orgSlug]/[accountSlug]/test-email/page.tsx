"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

export default function TestEmailPage() {
  const trpc = useTRPC();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    chartUrl?: string;
  } | null>(null);

  const sendTestEmail = useMutation({
    ...trpc.analytics.sendTestAnalyticsEmail.mutationOptions(),
    onSuccess: (data) => {
      setResult({
        success: true,
        message: `Email sent successfully to ${data.recipient}!`,
        chartUrl: data.chartUrl,
      });
      setLoading(false);
    },
    onError: (error) => {
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      });
      setLoading(false);
    },
  });

  const handleSendTest = () => {
    setLoading(true);
    setResult(null);

    // Sample 7-day data
    sendTestEmail.mutate({
      // Current metrics
      followers: 49,
      invites: 11,
      comments: 8,
      contentReach: 125,
      profileViews: 23,
      engageReach: 89,

      // 7 days of historical data
      followersWeek: [43, 44, 45, 46, 47, 48, 49],
      invitesWeek: [5, 6, 8, 9, 10, 11, 11],
      commentsWeek: [3, 4, 5, 6, 7, 8, 8],
      contentReachWeek: [90, 95, 100, 110, 115, 120, 125],
      profileViewsWeek: [15, 16, 18, 20, 21, 22, 23],
      engageReachWeek: [70, 72, 75, 81, 84, 86, 89],

      // Date labels (7 days)
      dateLabels: ["Feb 1", "Feb 2", "Feb 3", "Feb 4", "Feb 5", "Feb 6", "Feb 7"],
    });
  };

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-3xl font-bold">Test Analytics Email</h1>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          This will send a test weekly analytics email to your account email
          with sample data.
        </p>

        <div className="mb-6 rounded bg-muted p-4">
          <h3 className="mb-2 font-semibold">Sample Data (7 days):</h3>
          <ul className="space-y-1 text-sm">
            <li>• Followers: 43 → 49</li>
            <li>• Invites: 5 → 11</li>
            <li>• Comments: 3 → 8</li>
            <li>• Content Reach: 90 → 125</li>
            <li>• Profile Views: 15 → 23</li>
            <li>• Engage Reach: 70 → 89</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Feb 1 - Feb 7
          </p>
        </div>

        <button
          onClick={handleSendTest}
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Test Email"}
        </button>

        {result && (
          <div
            className={`mt-4 rounded-md p-4 ${
              result.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <p className="font-medium">
              {result.success ? "✅ Success!" : "❌ Error"}
            </p>
            <p className="mt-1 text-sm">{result.message}</p>
            {result.chartUrl && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">
                  View Chart URL
                </summary>
                <p className="mt-1 break-all text-xs">{result.chartUrl}</p>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-muted p-4">
        <h3 className="mb-2 font-semibold">What to verify:</h3>
        <ul className="space-y-1 text-sm">
          <li>1. Subject: "[Your Name] Weekly LinkedIn Wins! 📊"</li>
          <li>2. Sender: hello@engagekit.io</li>
          <li>3. Kit mascot GIF is blinking</li>
          <li>4. All 6 metric cards show correct values</li>
          <li>5. Chart shows 7 days (with -2d, -1d padding)</li>
          <li>6. Encouragement meme displays</li>
          <li>7. CTA button links to /earn-premium</li>
          <li>8. Mobile responsive layout</li>
        </ul>
      </div>
    </div>
  );
}
