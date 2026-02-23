"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Chrome, ExternalLink, Linkedin } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";

import { ASSETS } from "~/app/_components/landing/landing-content";

/**
 * Extension install modal shown on profile page after signup
 * - ?welcome=true: Web signup flow - shows install extension steps
 * - ?fromExtension=true: Extension signup flow - shows "return to LinkedIn"
 */
export function ExtensionInstallModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isFromExtension, setIsFromExtension] = useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);

  useEffect(() => {
    const welcome = searchParams.get("welcome") === "true";
    const fromExtension = searchParams.get("fromExtension") === "true";

    if (welcome || fromExtension) {
      setIsOpen(true);
      setIsFromExtension(fromExtension);
      // Remove the query param from URL without refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      url.searchParams.delete("fromExtension");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Check extension installation
    const checkExtension = () => {
      const marker = document.documentElement.getAttribute("data-trusthuman-ext");
      setIsExtensionInstalled(marker === "installed");
    };

    checkExtension();
    // Re-check periodically in case user installs during modal
    const interval = setInterval(checkExtension, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleInstall = () => {
    window.open(ASSETS.chromeWebStoreUrl, "_blank");
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleReturnToLinkedIn = () => {
    window.open("https://www.linkedin.com/feed/", "_blank");
    setIsOpen(false);
  };

  // Extension user flow - simpler modal with "return to LinkedIn" CTA
  if (isFromExtension) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/trusthuman-logo.svg"
                alt="TrustHuman"
                width={64}
                height={64}
                className="h-16 w-16"
              />
            </div>
            <DialogTitle className="text-xl">Welcome to TrustHuman!</DialogTitle>
            <DialogDescription className="text-base">
              Your account is ready. Now verify your first comment!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                This is your profile page. After you verify comments, they'll appear here.
              </p>
              <p className="text-sm font-medium">
                Go back to LinkedIn and write a genuine comment to get started!
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleReturnToLinkedIn} className="w-full gap-2">
              <Linkedin className="h-4 w-4" />
              Go to LinkedIn
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Explore my profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Web user flow - install extension steps
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/trusthuman-logo.svg"
              alt="TrustHuman"
              width={64}
              height={64}
              className="h-16 w-16"
            />
          </div>
          <DialogTitle className="text-xl">Welcome to TrustHuman!</DialogTitle>
          <DialogDescription className="text-base">
            You're one step away from getting verified
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1: Install Extension */}
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${isExtensionInstalled ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border"}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isExtensionInstalled ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              {isExtensionInstalled ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm font-bold">1</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">Install Chrome Extension</h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Add TrustHuman to your browser
              </p>
              {!isExtensionInstalled && (
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="mt-2 h-8 gap-1.5"
                >
                  <Chrome className="h-4 w-4" />
                  Install Extension
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Step 2: Go to LinkedIn/X */}
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${isExtensionInstalled ? "bg-muted/50 border-border" : "opacity-50"}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <span className="text-sm font-bold">2</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">Write a genuine comment</h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Go to LinkedIn or X and engage authentically
              </p>
            </div>
          </div>

          {/* Step 3: Verify */}
          <div className="flex items-start gap-3 p-3 rounded-lg border opacity-50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <span className="text-sm font-bold">3</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">Click "Verify Human" button</h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Quick selfie verification proves you're human
              </p>
            </div>
          </div>

          {/* Step 4: Get Badge */}
          <div className="flex items-start gap-3 p-3 rounded-lg border opacity-50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <span className="text-sm font-bold">4</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">Get your verified badge!</h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Your profile shows verified human status
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isExtensionInstalled ? (
            <Button onClick={handleClose} className="w-full">
              Got it, let's go!
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose} className="w-full">
              I'll do this later
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
