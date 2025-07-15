import React from "react";

import { getSyncHostUrl } from "../../../utils/url";

interface CommentLimitStatusProps {
  isPremium: boolean | null;
  dailyCount: number;
  limit: number;
  isLoading: boolean;
}

export const UpgradeLink = () => {
  const url = `${getSyncHostUrl()}/subscription`;
  return (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault();
        chrome.tabs.create({ url });
      }}
      className="font-bold text-blue-600 underline hover:text-blue-700"
    >
      Upgrade
    </a>
  );
};

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
  let message: React.ReactNode;
  let colorClass: string;

  if (!isPremium) {
    // Free plan
    if (isAtLimit) {
      message = (
        <>You have used up all comments today out of 100 allowed by LinkedIn.</>
      );
      colorClass = "text-red-600";
    } else {
      message = (
        <>
          Your free plan has {remaining} comments left today out of 100 allowed
          by LinkedIn.
        </>
      );
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
