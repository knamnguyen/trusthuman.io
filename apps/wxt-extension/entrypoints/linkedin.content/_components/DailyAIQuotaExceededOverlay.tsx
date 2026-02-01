/**
 * DailyAIQuotaExceededOverlay - Shows when daily free AI comments generation exceeded
 * Displayed on all tabs
 */

import { useAuthStore } from "@/lib/auth-store";
import { ArrowRight, Clock, XIcon, Zap } from "lucide-react";
import posthog from "posthog-js";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { getWebAppDomain } from "../../../lib/get-sync-host-url";
import { useOrgSubscription } from "../hooks/use-org-subscription";
import { useAccountStore } from "../stores";
import { useDailyQuotaLimitHitDialogStore } from "../stores/dialog-store";
import { useSettingsLocalStore } from "../stores/settings-local-store";

export function DailyAIQuotaExceededOverlay() {
  const organization = useAuthStore((state) => state.organization);
  const account = useAccountStore((state) => state.matchingAccount);

  const updateBehavior = useSettingsLocalStore((state) => state.updateBehavior);

  const closeDailyAIQuotaExceededOverlay = useDailyQuotaLimitHitDialogStore(
    (state) => state.close,
  );

  const showTurnOffAiComments = useDailyQuotaLimitHitDialogStore(
    (state) => state.data?.showTurnOffAiCommentGenerationButton === true,
  );

  const subscription = useOrgSubscription();

  useEffect(() => {
    posthog.capture("extension:daily-quota-dialog:v1:shown", {
      organizationId: organization?.id,
    });
  }, []);

  const handleUpgrade = () => {
    posthog.capture("extension:daily-quota-dialog:v1:upgrade-clicked", {
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

  return (
    <div className="bg-background/90 absolute inset-0 z-40 flex items-center justify-center backdrop-blur-sm">
      <Card className="relative mx-4 w-full max-w-md shadow-lg">
        <button
          className="hover:bg-muted/50 absolute top-3 right-3 rounded-full p-1"
          onClick={closeDailyAIQuotaExceededOverlay}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Zap className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>You've used your free AI comments for today</CardTitle>
          <CardDescription>
            <div>
              Upgrade to a paid plan to continue generating unlimited ai
              comments{" "}
              {showTurnOffAiComments &&
                `or turn on 100% human mode to skip ai comments generation
              and continue engaging`}
              .
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Clock className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Quota resets daily</p>
                <p className="text-muted-foreground text-sm">
                  Come back tomorrow for more free AI comments, or upgrade now
                  to keep the momentum going
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleUpgrade} className="w-full" size="lg">
              Upgrade Your Plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {showTurnOffAiComments === true && (
              <Button
                variant="ghost"
                className="w-full"
                size="lg"
                onClick={() => {
                  updateBehavior("humanOnlyMode", true);
                  closeDailyAIQuotaExceededOverlay();
                }}
              >
                Turn off AI Comment Generations
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-center text-xs">
              Questions? Contact us at{" "}
              <a
                href={`mailto:engagekit.io@gmail.com`}
                className="text-primary hover:underline"
              >
                Support
              </a>
            </p>

            <p className="text-muted-foreground text-center text-xs">
              Already subcribed?{" "}
              <button
                onClick={async () => {
                  const data = await subscription.refetch();
                  if (data.data?.isPremium === true) {
                    closeDailyAIQuotaExceededOverlay();
                  }
                }}
                className="text-primary hover:underline"
              >
                {subscription.isFetching ? "Refreshing..." : "Refresh"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
