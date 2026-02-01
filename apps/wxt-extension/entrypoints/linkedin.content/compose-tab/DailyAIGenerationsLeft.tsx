import { useMemo } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import posthog from "posthog-js";

import { Button } from "@sassy/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sassy/ui/tooltip";

import { getWebAppDomain } from "../../../lib/get-sync-host-url";
import { useOrgSubscription } from "../hooks/use-org-subscription";
import { useAccountStore, useShadowRootStore } from "../stores";

export function DailyAIGenerationsLeft() {
  const subscription = useOrgSubscription();
  const organization = useAuthStore((state) => state.organization);
  const account = useAccountStore((state) => state.matchingAccount);
  const trpc = useTRPC();
  const shadowRoot = useShadowRootStore((state) => state.shadowRoot);
  const quota = useQuery(trpc.aiComments.quota.queryOptions());

  const handleUpgrade = () => {
    posthog.capture("extension:daily-ai-generations-left:v1:upgrade-clicked", {
      organizationId: organization?.id,
    });

    const webAppDomain = getWebAppDomain();
    let prefix = webAppDomain.endsWith("/")
      ? webAppDomain.slice(0, -1)
      : webAppDomain;

    if (organization !== null) {
      prefix += `/${organization.slug}`;
    }

    if (account !== null) {
      prefix += `/${account.profileSlug}`;
    }

    const upgradeUrl = `${prefix}/settings`;
    window.open(upgradeUrl, "_blank");
  };

  const circleConfig = useMemo(() => {
    if (quota.data === undefined || quota.data === null) {
      return null;
    }

    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const remainingPercentage = quota.data.left / quota.data.limit;
    const offset = circumference * (1 - remainingPercentage);

    return {
      radius,
      circumference,
      offset,
      remainingPercentage,
    };
  }, [quota.data?.used, quota.data?.limit]);

  if (
    subscription.data === undefined ||
    subscription.data.isPremium === true ||
    circleConfig === null ||
    !quota.data
  ) {
    return null;
  }

  const strokeColor =
    circleConfig.remainingPercentage > 0.5
      ? "text-primary"
      : circleConfig.remainingPercentage > 0.2
        ? "text-amber-500"
        : "text-red-500";

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          onClick={handleUpgrade}
          className="hover:bg-muted flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors"
        >
          <div className="relative h-6 w-6 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r={circleConfig.radius}
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="12"
                cy="12"
                r={circleConfig.radius}
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                className={strokeColor}
                strokeDasharray={circleConfig.circumference}
                strokeDashoffset={circleConfig.offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
              {quota.data.left}
            </div>
          </div>
          <span className="text-[12px] leading-tight whitespace-nowrap">
            left
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            className="text-primary"
          >
            <path d="M19.745 10.5a1.4 1.4 0 0 1-.26.66l-7.94 10.73a.94.94 0 0 1-.53.35a.8.8 0 0 1-.22 0a1.1 1.1 0 0 1-.4-.08a1 1 0 0 1-.55-1l.8-6.21h-5.13a1.4 1.4 0 0 1-.7-.22a1.33 1.33 0 0 1-.46-.56a1.45 1.45 0 0 1-.1-.69c.03-.236.12-.46.26-.65l7.94-10.71a.93.93 0 0 1 .51-.34a1 1 0 0 1 .63.06a.94.94 0 0 1 .44.42a1 1 0 0 1 .11.55l-.8 6.21h5.14a1.16 1.16 0 0 1 .7.22c.194.141.35.33.45.55c.096.223.134.467.11.71" />
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="flex flex-col gap-2 p-3"
        container={shadowRoot ?? undefined}
      >
        <p className="text-sm font-medium">
          {quota.data.left}/{quota.data.limit} Free AI generations remaining
          today
        </p>
        <p className="text-muted-foreground text-xs">
          Upgrade for more daily generations.
        </p>
        <Button variant="outline" size="sm" onClick={() => handleUpgrade()}>
          <Zap className="mr-1 h-3 w-3" />
          Upgrade
        </Button>
      </TooltipContent>
    </Tooltip>
  );
}
