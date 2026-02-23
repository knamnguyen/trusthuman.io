"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Chrome,
  ExternalLink,
  Linkedin,
  Mail,
  Monitor,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";

import { ASSETS } from "~/app/_components/landing/landing-content";

// X icon component
function XIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Facebook icon component
function FacebookIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// Mock activity data for preview
const MOCK_ACTIVITIES = [
  {
    id: "mock-1",
    type: "linkedin" as const,
    verified: true,
    parentAuthorName: "Tech Leader",
    parentAuthorAvatarUrl: "/pictures/placeholder-1.jpg",
    parentTextSnippet: "AI is transforming how we work and collaborate. The future is about augmenting human capabilities...",
    commentText: "Great insights! The future of work is definitely being reshaped by AI tools that augment human capabilities rather than replace them.",
    createdAt: new Date(),
  },
  {
    id: "mock-2",
    type: "x" as const,
    verified: true,
    parentAuthorName: "Startup Founder",
    parentAuthorAvatarUrl: "/pictures/placeholder-2.jpg",
    parentTextSnippet: "The most important thing is to build something people actually love and use every day...",
    commentText: "Building products people love requires deep empathy and relentless iteration. Completely agree with this approach!",
    createdAt: new Date(),
  },
  {
    id: "mock-3",
    type: "facebook" as const,
    verified: true,
    parentAuthorName: "Industry Expert",
    parentAuthorAvatarUrl: "/pictures/placeholder-3.jpg",
    parentTextSnippet: "Excited to share what we've been working on for the past year...",
    commentText: "This is amazing! Can't wait to see how this evolves. The potential here is huge.",
    createdAt: new Date(),
  },
];

// Detect if user is on mobile
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(userAgent));
    };
    checkMobile();
  }, []);

  return isMobile;
}

// Detect if extension is installed
function useIsExtensionInstalled(): boolean {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkExtension = () => {
      const marker = document.documentElement.getAttribute("data-trusthuman-ext");
      setIsInstalled(marker === "installed");
    };
    checkExtension();
    // Re-check periodically
    const interval = setInterval(checkExtension, 2000);
    return () => clearInterval(interval);
  }, []);

  return isInstalled;
}

interface EmptyProfileStateProps {
  username: string;
  displayName: string | null;
  isOwner: boolean;
}

export function EmptyProfileState({ username, displayName, isOwner }: EmptyProfileStateProps) {
  const isMobile = useIsMobile();
  const isExtensionInstalled = useIsExtensionInstalled();

  const handleInstallExtension = () => {
    window.open(ASSETS.chromeWebStoreUrl, "_blank");
  };

  const handleGoToLinkedIn = () => {
    window.open("https://www.linkedin.com/feed/", "_blank");
  };

  const handleGoToX = () => {
    window.open("https://x.com/home", "_blank");
  };

  const handleGoToFacebook = () => {
    window.open("https://www.facebook.com/", "_blank");
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold">
                Welcome to TrustHuman{isOwner ? `, ${displayName || username}` : ""}!
              </h2>
            </div>

            <p className="text-muted-foreground max-w-md">
              {isOwner
                ? "Your profile is ready. Now let's verify your humanity and show the world you're real!"
                : `${displayName || username} hasn't verified any activity yet. Check back soon!`
              }
            </p>

            {isOwner && (
              <>
                {/* Mobile Message */}
                {isMobile ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-5 w-5 text-amber-600" />
                      <span className="font-medium text-amber-700">Desktop Required</span>
                    </div>
                    <p className="text-sm text-amber-700/80 mb-3">
                      TrustHuman verification works with the Chrome extension on desktop.
                      We'll send you an email reminder to get started!
                    </p>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Email me a reminder
                    </Button>
                  </div>
                ) : (
                  /* Desktop CTAs */
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    {!isExtensionInstalled ? (
                      <Button onClick={handleInstallExtension} className="flex-1 gap-2">
                        <Chrome className="h-4 w-4" />
                        Install Chrome Extension
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleGoToLinkedIn} variant="outline" className="flex-1 gap-2">
                          <Linkedin className="h-4 w-4 text-[#0a66c2]" />
                          LinkedIn
                        </Button>
                        <Button onClick={handleGoToX} variant="outline" className="flex-1 gap-2">
                          <XIcon size={16} />
                          X / Twitter
                        </Button>
                        <Button onClick={handleGoToFacebook} variant="outline" className="flex-1 gap-2">
                          <FacebookIcon size={16} className="text-[#1877f2]" />
                          Facebook
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Quick Steps */}
                {!isMobile && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-4">
                    <div className={`flex items-center gap-2 text-sm ${isExtensionInstalled ? "text-primary" : "text-muted-foreground"}`}>
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${isExtensionInstalled ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {isExtensionInstalled ? "✓" : "1"}
                      </div>
                      <span>Install extension</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</div>
                      <span>Comment on a post</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">3</div>
                      <span>Quick selfie verify</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section - What your profile will look like */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isOwner ? "What your profile will look like:" : "Example of verified activity:"}
          </span>
        </div>

        {/* Mock Stats - Ghost Style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 opacity-50">
          <Card className="border-dashed">
            <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 text-center">
              <div className="text-primary text-xl sm:text-2xl font-bold">#42</div>
              <div className="text-muted-foreground text-[9px] sm:text-[10px]">🌍 Human Rank</div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 text-center">
              <div className="text-xl sm:text-2xl font-bold">12</div>
              <div className="text-muted-foreground text-[9px] sm:text-[10px]">✅ Verified Actions</div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-500">5</div>
              <div className="text-muted-foreground text-[9px] sm:text-[10px]">🔥 Day Streak</div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-500">7</div>
              <div className="text-muted-foreground text-[9px] sm:text-[10px]">⭐ Best Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Mock Activity Cards - Ghost Style */}
        <Card className="border-dashed opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">💬 Verified Human Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {MOCK_ACTIVITIES.map((activity) => (
                <div key={activity.id} className="mb-4 break-inside-avoid-column">
                  <Card className="overflow-hidden ring-1 ring-primary/20 border-dashed">
                    <CardContent className="space-y-3 p-4">
                      {/* Header: Platform + Verified badge */}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`px-1.5 py-0 text-[10px] ${
                            activity.type === "x"
                              ? "border-black bg-black text-white"
                              : activity.type === "linkedin"
                                ? "border-[#0a66c2] bg-[#0a66c2] text-white"
                                : "border-[#1877f2] bg-[#1877f2] text-white"
                          }`}
                        >
                          {activity.type === "x" ? "X" : activity.type === "linkedin" ? "LinkedIn" : "Facebook"}
                        </Badge>
                        <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                          Verified
                        </Badge>
                      </div>

                      {/* Original post context */}
                      <div className="bg-muted/30 border-muted-foreground/30 rounded-lg border-l-2 p-3">
                        <div className="mb-1.5 flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px] bg-muted">
                              {activity.parentAuthorName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-xs font-medium">
                            {activity.parentAuthorName}
                          </span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {activity.parentTextSnippet}
                        </p>
                      </div>

                      {/* User's reply */}
                      <div>
                        <div className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs">
                          <span className="text-primary">✓</span>
                          <span>Your verified {activity.type === "x" ? "reply" : "comment"}</span>
                        </div>
                        <p className="text-sm line-clamp-3">{activity.commentText}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-muted-foreground text-xs">Today</span>
                        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" disabled>
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA for non-owners */}
      {!isOwner && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Want to get verified too?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Join TrustHuman and prove you're a real human on social media.
            </p>
            <Button asChild>
              <Link href="/">Get Your Human #</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
