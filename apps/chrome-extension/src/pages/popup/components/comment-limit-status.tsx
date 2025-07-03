import React from "react";

interface CommentLimitStatusProps {
  isPremium: boolean | null;
  dailyCount: number;
  limit: number;
  isLoading: boolean;
}

export const CommentLimitStatus: React.FC<CommentLimitStatusProps> = ({
  isPremium,
  dailyCount,
  limit,
  isLoading,
}) => {
  // Show loading state
  if (isLoading || isPremium === null) {
    return (
      <div className="mb-3 text-sm text-gray-500">
        Loading comment status...
      </div>
    );
  }

  const remaining = Math.max(0, limit - dailyCount);
  const isAtLimit = dailyCount >= limit;

  // Determine message and color
  let message: string;
  let colorClass: string;

  if (!isPremium) {
    // Free plan
    if (isAtLimit) {
      message =
        "You have used up all free comments today out of 15. Upgrade now to get 100 comments/day";
      colorClass = "text-red-600";
    } else {
      message = `Your free plan has ${remaining} comments left today out of 15. Upgrade to get 100 comments per day`;
      colorClass = "text-red-600";
    }
  } else {
    // Premium plan
    if (isAtLimit) {
      message =
        "My premium master, you've hit LinkedIn 100 comments limit today. Please come back tomorrow to make sure your account is healthy";
      colorClass = "text-red-600";
    } else {
      message = `My premium master, there are ${remaining} comments left before hitting LinkedIn limits today (out of 100)`;
      colorClass = "text-green-600";
    }
  }

  return (
    <div className={`mb-3 text-sm font-medium ${colorClass}`}>{message}</div>
  );
};
