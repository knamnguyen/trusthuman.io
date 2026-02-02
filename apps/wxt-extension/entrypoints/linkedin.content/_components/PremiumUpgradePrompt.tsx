/**
 * PremiumUpgradePrompt - Shows when user tries to use premium features without subscription
 */

import { Crown, ExternalLink } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@sassy/ui/alert";
import { Button } from "@sassy/ui/button";

import { getWebAppDomain } from "../../../lib/get-sync-host-url";
import { useAccountStore } from "../stores";

interface PremiumUpgradePromptProps {
  feature: string;
  isOverQuota?: boolean;
  overQuotaBy?: number;
}

export function PremiumUpgradePrompt({
  feature,
  isOverQuota = false,
  overQuotaBy = 0,
}: PremiumUpgradePromptProps) {
  const { organization } = useAccountStore();

  const handleUpgrade = () => {
    const webAppDomain = getWebAppDomain();
    const settingsUrl = `${webAppDomain}/${organization?.slug}/settings`;
    window.open(settingsUrl, "_blank");
  };

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <Crown className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        {isOverQuota ? "Over Quota" : "Premium Feature"}
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        {isOverQuota ? (
          <span>
            You have {overQuotaBy} more account(s) than your plan allows.
            Remove accounts or upgrade to restore {feature}.
          </span>
        ) : (
          <span>{feature} requires a Premium subscription.</span>
        )}
        <Button
          variant="link"
          size="sm"
          className="ml-1 h-auto p-0 text-amber-900 underline dark:text-amber-100"
          onClick={handleUpgrade}
        >
          Upgrade Now
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
