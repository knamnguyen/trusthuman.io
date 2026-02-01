/**
 * DailyAIQuotaExceededOverlay - Shows when daily free AI comments generation exceeded
 * Displayed on all tabs
 */

import { useAuthStore } from "@/lib/auth-store";
import { ArrowRight, Clock, Zap } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { getWebAppDomain } from "../../../lib/get-sync-host-url";

export function DailyAIQuotaExceededOverlay() {
  const organization = useAuthStore((state) => state.organization);

  const handleUpgrade = () => {
    const webAppDomain = getWebAppDomain();
    const upgradeUrl = `${webAppDomain}/${organization?.slug}/subscription`;
    window.open(upgradeUrl, "_blank");
  };

  return (
    <div className="bg-background/90 absolute inset-0 z-40 flex items-center justify-center backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Zap className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>You've used your free AI comments for today</CardTitle>
          <CardDescription>
            Your daily limit of free AI-generated comments has been reached.
            Upgrade to a paid plan to continue generating unlimited comments or
            turn on the full human-mode setting to keep engaging.
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

          <Button onClick={handleUpgrade} className="w-full" size="lg">
            Upgrade Your Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Questions? Contact us at{" "}
            <a
              href={`mailto:engagekit.io@gmail.com`}
              className="text-primary hover:underline"
            >
              Support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
