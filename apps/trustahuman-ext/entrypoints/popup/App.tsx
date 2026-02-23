import { useEffect, useState } from "react";
import { Loader2Icon, Shield, LogIn } from "lucide-react";

import { Button } from "@sassy/ui/button";

type PageState = "loading" | "linkedin" | "x" | "facebook" | "other";

interface AuthStatus {
  isSignedIn: boolean;
  user: {
    id: string;
    emailAddress: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
  } | null;
}

export default function App() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [isToggling, setIsToggling] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getAuthStatus" }, (response) => {
      if (response?.success && response.data) {
        setAuthStatus(response.data);
      } else {
        setAuthStatus({ isSignedIn: false, user: null });
      }
      setIsCheckingAuth(false);
    });
  }, []);

  // Check current tab
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const url = currentTab?.url ?? "";

      if (url.includes("linkedin.com")) {
        setPageState("linkedin");
      } else if (url.includes("x.com") || url.includes("twitter.com")) {
        setPageState("x");
      } else if (url.includes("facebook.com")) {
        setPageState("facebook");
      } else {
        setPageState("other");
      }
    });
  }, []);

  const toggleSidebar = async () => {
    setIsToggling(true);
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (!currentTab?.id) {
        console.error("No active tab found");
        setIsToggling(false);
        return;
      }

      // Send message to content script to toggle sidebar
      chrome.tabs.sendMessage(
        currentTab.id,
        { type: "OPEN_SIDEBAR" },
        (response) => {
          // If no response, the content script might not be loaded
          if (chrome.runtime.lastError || !response) {
            console.log("Content script not responding, refreshing page...");
            chrome.tabs.reload(currentTab.id!);
          } else {
            console.log("Sidebar toggled successfully");
            window.close(); // Close popup after toggling
          }
          setIsToggling(false);
        },
      );
    } catch (error) {
      console.error("Error toggling sidebar:", error);
      setIsToggling(false);
    }
  };

  const openLinkedIn = () => {
    chrome.tabs.create({ url: "https://www.linkedin.com/feed/" });
    window.close();
  };

  const openX = () => {
    chrome.tabs.create({ url: "https://x.com/home" });
    window.close();
  };

  const openFacebook = () => {
    chrome.tabs.create({ url: "https://www.facebook.com/" });
    window.close();
  };

  const openSignIn = () => {
    chrome.runtime.sendMessage({ action: "openSignIn" });
    window.close();
  };

  const renderContent = () => {
    if (pageState === "loading" || isCheckingAuth) {
      return (
        <div className="flex justify-center py-4">
          <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }

    // Show sign-in prompt if not authenticated
    if (!authStatus?.isSignedIn) {
      return (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Sign in to start verifying your humanity
          </p>

          <Button onClick={openSignIn} className="w-full gap-2">
            <LogIn className="h-4 w-4" />
            Sign In to TrustHuman
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or go to
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={openLinkedIn} className="w-full" variant="outline">
              LinkedIn
            </Button>
            <Button onClick={openX} className="w-full" variant="outline">
              X (Twitter)
            </Button>
            <Button onClick={openFacebook} className="w-full" variant="outline">
              Facebook
            </Button>
          </div>
        </div>
      );
    }

    // On a supported platform - show sidebar button
    if (pageState === "linkedin" || pageState === "x" || pageState === "facebook") {
      const platformName =
        pageState === "linkedin" ? "LinkedIn" :
        pageState === "x" ? "X" :
        "Facebook";

      return (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            You're on {platformName}. Open the sidebar to start verifying.
          </p>

          <Button
            onClick={toggleSidebar}
            disabled={isToggling}
            className="w-full"
          >
            {isToggling ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              "Open Sidebar"
            )}
          </Button>
        </div>
      );
    }

    // On other sites - show platform buttons
    return (
      <div className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          Navigate to a supported platform to verify your humanity
        </p>

        <div className="flex flex-col gap-2">
          <Button onClick={openLinkedIn} className="w-full" variant="primary">
            Go to LinkedIn
          </Button>
          <Button onClick={openX} className="w-full" variant="outline">
            Go to X (Twitter)
          </Button>
          <Button onClick={openFacebook} className="w-full" variant="outline">
            Go to Facebook
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 bg-background p-4">
      {/* Header */}
      <div className="mb-4 flex flex-col items-center">
        <Shield className="h-10 w-10 text-primary" />
        <h1 className="mt-2 text-lg font-semibold">Trust a Human</h1>
        <p className="text-xs text-muted-foreground">
          {authStatus?.isSignedIn
            ? `Hi, ${authStatus.user?.firstName || "Human"}!`
            : "Verify your humanity"}
        </p>
      </div>

      {renderContent()}
    </div>
  );
}
