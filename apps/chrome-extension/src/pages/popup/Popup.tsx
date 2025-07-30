import React, { useEffect, useState } from "react";

import engageKitLogo from "../../../public/icon-128.png";
import { DEFAULT_STYLE_GUIDES_FREE } from "../../config/default-style-guides-free";
import { DEFAULT_STYLE_GUIDES_PREMIUM } from "../../config/default-style-guides-premium";
import { FEATURE_CONFIG } from "../../config/features";
import { useBackgroundAuth } from "../../hooks/use-background-auth";
import { useDailyCommentCount } from "../../hooks/use-daily-comment-count";
import { usePremiumStatus } from "../../hooks/use-premium-status";
import { clearCachedUserData } from "../../hooks/use-user-data";
import Auth from "./components/auth";
import {
  CommentLimitStatus,
  UpgradeLink,
} from "./components/comment-limit-status";
import ErrorDisplay from "./components/error-display";
import RunningStatusBanner from "./components/running-status-banner";
import SettingsForm from "./components/settings-form";
import StatisticsDashboard from "./components/statistics-dashboard";
import UserProfile from "./components/user-profile";

// Default comment style guide
const DEFAULT_STYLE_GUIDE = `You are about to write a LinkedIn comment. Imagine you are a young professional or ambitious student (Gen Z), scrolling through your LinkedIn feed during a quick break – maybe between classes, on your commute, or while grabbing a coffee. You're sharp, interested in tech, business, career growth, personal development, social impact, product, marketing, or entrepreneurship. You appreciate authentic, slightly edgy, and insightful content.

IMPORTANT: Only respond with the comment, no other text.`;

// New type for user-defined custom styles
type CustomStyle = {
  name: string; // unique (case-insensitive)
  prompt: string;
};

// Helper function to get style guide prompt based on key and premium status
const getStyleGuidePrompt = (
  key:
    | keyof typeof DEFAULT_STYLE_GUIDES_FREE
    | keyof typeof DEFAULT_STYLE_GUIDES_PREMIUM,
  isPremium: boolean | null,
): string => {
  if (isPremium && key in DEFAULT_STYLE_GUIDES_PREMIUM) {
    return DEFAULT_STYLE_GUIDES_PREMIUM[
      key as keyof typeof DEFAULT_STYLE_GUIDES_PREMIUM
    ].prompt;
  }
  if (key in DEFAULT_STYLE_GUIDES_FREE) {
    return DEFAULT_STYLE_GUIDES_FREE[
      key as keyof typeof DEFAULT_STYLE_GUIDES_FREE
    ].prompt;
  }
  // Fallback to PROFESSIONAL from free guides
  return DEFAULT_STYLE_GUIDES_FREE.PROFESSIONAL.prompt;
};

export default function Popup() {
  const { user, isLoaded, isSignedIn, signOut, isSigningOut } =
    useBackgroundAuth();
  const {
    isPremium,
    isLoading: isPremiumLoading,
    status: premiumStatus,
  } = usePremiumStatus();
  const {
    data: dailyCommentCount,
    isLoading: isDailyCountLoading,
    status: dailyCountStatus,
  } = useDailyCommentCount();

  // Add comprehensive logging for debugging
  console.log("Popup render - Premium Status:", {
    isPremium,
    isPremiumLoading,
    userId: user?.id,
    isLoaded,
    isSignedIn,
  });

  const [styleGuide, setStyleGuide] = useState("");
  // Selected style key can be a default style key or the name of a custom style
  const [selectedStyleKey, setSelectedStyleKey] =
    useState<string>("PROFESSIONAL");

  // Array of user-saved custom styles
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>([]);
  const [scrollDuration, setScrollDuration] = useState(5);
  const [commentDelay, setCommentDelay] = useState(5);
  const [maxPosts, setMaxPosts] = useState(5);
  const [duplicateWindow, setDuplicateWindow] = useState(24);
  const [timeFilterEnabled, setTimeFilterEnabled] = useState(false);
  const [minPostAge, setMinPostAge] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [totalAllTimeComments, setTotalAllTimeComments] = useState(0);
  const [totalTodayComments, setTotalTodayComments] = useState(0);
  const [postsSkippedDuplicate, setPostsSkippedDuplicate] = useState(0);
  const [recentAuthorsDetected, setRecentAuthorsDetected] = useState(0);
  const [postsSkippedAlreadyCommented, setPostsSkippedAlreadyCommented] =
    useState(0);
  const [duplicatePostsDetected, setDuplicatePostsDetected] = useState(0);
  const [postsSkippedTimeFilter, setPostsSkippedTimeFilter] = useState(0);
  const [commentProfileName, setCommentProfileName] = useState("");
  const [commentAsCompanyEnabled, setCommentAsCompanyEnabled] = useState(false);
  const [languageAwareEnabled, setLanguageAwareEnabled] = useState(false);
  const [skipCompanyPagesEnabled, setSkipCompanyPagesEnabled] = useState(false);
  const [skipPromotedPostsEnabled, setSkipPromotedPostsEnabled] =
    useState(false);
  const [skipFriendsActivitiesEnabled, setSkipFriendsActivitiesEnabled] =
    useState(false);
  const [lastError, setLastError] = useState<any>(null);
  const [blacklistEnabled, setBlacklistEnabled] = useState(false);
  const [blacklistAuthors, setBlacklistAuthors] = useState("");

  // Determine max posts limit based on plan - handle null case during loading
  const maxPostsLimit =
    isPremium === null
      ? FEATURE_CONFIG.maxPosts.premiumTierLimit // Default to premium limit during loading
      : isPremium
        ? FEATURE_CONFIG.maxPosts.premiumTierLimit
        : FEATURE_CONFIG.maxPosts.freeTierLimit;

  console.log("maxPostsLimit calculation:", {
    isPremium,
    maxPostsLimit,
    premiumLimit: FEATURE_CONFIG.maxPosts.premiumTierLimit,
    freeLimit: FEATURE_CONFIG.maxPosts.freeTierLimit,
  });

  // Daily comment limit (same 100 for both plans)
  const dailyLimit = isPremium
    ? FEATURE_CONFIG.dailyComments.premiumTierLimit
    : FEATURE_CONFIG.dailyComments.freeTierLimit;

  // Free-plan custom style guide length enforcement (≤100 words)
  const styleGuideWordCount = styleGuide
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const styleGuideCharCount = styleGuide.replace(/\s+/g, "").length;
  const styleGuideTooLong =
    isPremium === false &&
    (styleGuideWordCount > 100 || styleGuideCharCount > 600);

  // Check if daily limit is reached
  const isDailyLimitReached = (dailyCommentCount ?? 0) >= dailyLimit;

  // Combine all loading states to prevent premature actions
  const isInitialDataLoading =
    !isLoaded || premiumStatus === "pending" || dailyCountStatus === "pending";

  // Simple auth state tracking
  const [hasEverSignedIn, setHasEverSignedIn] = useState<boolean>(false);

  // Track premium status changes
  useEffect(() => {
    console.log("Premium status changed:", {
      isPremium,
      isPremiumLoading,
      timestamp: new Date().toISOString(),
    });
  }, [isPremium, isPremiumLoading]);

  // Load simple auth state on mount and check background auth status
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        // First load from storage (for immediate UI response)
        chrome.storage.local.get(["hasEverSignedIn"], async (result) => {
          if (result.hasEverSignedIn) {
            setHasEverSignedIn(true);
          }

          // Then check with background service (in case user signed in via web)
          if (!result.hasEverSignedIn) {
            console.log(
              "Popup: Checking auth status with background service...",
            );
            try {
              const response = await chrome.runtime.sendMessage({
                action: "getAuthStatus",
              });

              console.log("Popup: Background auth check result:", response);

              // If user is signed in according to background, update local state
              if (response?.isSignedIn && response?.user) {
                console.log(
                  "Popup: User is signed in according to background, updating state",
                );
                setHasEverSignedIn(true);
                chrome.storage.local.set({ hasEverSignedIn: true });
              }
            } catch (error) {
              console.error(
                "Popup: Error checking auth status with background:",
                error,
              );
            }
          }
        });
      } catch (error) {
        console.error("Popup: Error loading auth state:", error);
      }
    };

    loadAuthState();
  }, []);

  // Update auth state when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn && user && !hasEverSignedIn) {
      console.log("User signed in for first time, saving auth state");
      setHasEverSignedIn(true);
      chrome.storage.local.set({ hasEverSignedIn: true });
    }
  }, [isLoaded, isSignedIn, user, hasEverSignedIn]);

  // Reset auth state if Clerk loads and user is not actually signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn && hasEverSignedIn) {
      console.log("Clerk loaded but user not signed in, resetting auth state");
      setHasEverSignedIn(false);
      chrome.storage.local.set({ hasEverSignedIn: false });

      // Clear cached user data when signing out
      clearCachedUserData(user?.id);
    }
  }, [isLoaded, isSignedIn, hasEverSignedIn, user?.id]);

  // Load saved data from storage on component mount
  useEffect(() => {
    console.log("Settings loading effect triggered - Premium status:", {
      isPremium,
      isPremiumLoading,
      maxPostsLimit,
    });

    chrome.storage.local.get(
      [
        "apiKey",
        "styleGuide",
        "scrollDuration",
        "commentDelay",
        "maxPosts",
        "duplicateWindow",
        "timeFilterEnabled",
        "minPostAge",
        "totalAllTimeComments",
        "isRunning",
        "currentCommentCount",
        "postsSkippedDuplicate",
        "recentAuthorsDetected",
        "postsSkippedAlreadyCommented",
        "duplicatePostsDetected",
        "postsSkippedTimeFilter",
        "commentProfileName",
        "commentAsCompanyEnabled",
        "languageAwareEnabled",
        "skipCompanyPagesEnabled",
        "skipPromotedPostsEnabled",
        "skipFriendsActivitiesEnabled",
        "selectedStyleKey",
        "customStyleGuides",
        "blacklistEnabled",
        "blacklistAuthors",
      ],
      (result) => {
        console.log("Popup: Loading settings from storage:", result);
        console.log("Premium status during settings load:", {
          isPremium,
          isPremiumLoading,
          maxPostsLimit,
        });

        if (Array.isArray(result.customStyleGuides)) {
          setCustomStyles(result.customStyleGuides as CustomStyle[]);
        }

        if (result.selectedStyleKey) {
          setSelectedStyleKey(result.selectedStyleKey as string);
        }
        if (result.styleGuide !== undefined) {
          const styleKey =
            (result.selectedStyleKey as string) ?? "PROFESSIONAL";
          setStyleGuide(getPromptForKey(styleKey));
        } else {
          const styleKey = result.selectedStyleKey ?? "PROFESSIONAL";
          setStyleGuide(getPromptForKey(styleKey));
        }
        if (result.scrollDuration !== undefined)
          setScrollDuration(result.scrollDuration);
        if (result.commentDelay !== undefined)
          setCommentDelay(result.commentDelay);
        if (result.maxPosts !== undefined) {
          // Validate max posts against the current limit
          const validMaxPosts = Math.min(result.maxPosts, maxPostsLimit);
          setMaxPosts(validMaxPosts);
          console.log("Popup: Validated maxPosts:", {
            stored: result.maxPosts,
            limit: maxPostsLimit,
            final: validMaxPosts,
          });
        }
        if (result.duplicateWindow !== undefined)
          setDuplicateWindow(result.duplicateWindow);
        if (result.timeFilterEnabled !== undefined)
          setTimeFilterEnabled(result.timeFilterEnabled);
        if (result.minPostAge !== undefined) setMinPostAge(result.minPostAge);
        if (result.totalAllTimeComments !== undefined)
          setTotalAllTimeComments(result.totalAllTimeComments);
        if (result.isRunning !== undefined) setIsRunning(result.isRunning);
        if (result.currentCommentCount !== undefined)
          setCommentCount(result.currentCommentCount);
        if (result.postsSkippedDuplicate !== undefined)
          setPostsSkippedDuplicate(result.postsSkippedDuplicate);
        if (result.recentAuthorsDetected !== undefined)
          setRecentAuthorsDetected(result.recentAuthorsDetected);
        if (result.postsSkippedAlreadyCommented !== undefined)
          setPostsSkippedAlreadyCommented(result.postsSkippedAlreadyCommented);
        if (result.duplicatePostsDetected !== undefined)
          setDuplicatePostsDetected(result.duplicatePostsDetected);
        if (result.postsSkippedTimeFilter !== undefined)
          setPostsSkippedTimeFilter(result.postsSkippedTimeFilter);

        if (result.commentProfileName !== undefined) {
          setCommentProfileName(result.commentProfileName);
        }
        if (result.commentAsCompanyEnabled !== undefined) {
          setCommentAsCompanyEnabled(result.commentAsCompanyEnabled);
        }
        if (result.languageAwareEnabled !== undefined) {
          setLanguageAwareEnabled(result.languageAwareEnabled);
        }
        if (result.skipCompanyPagesEnabled !== undefined)
          setSkipCompanyPagesEnabled(result.skipCompanyPagesEnabled);
        if (result.skipPromotedPostsEnabled !== undefined)
          setSkipPromotedPostsEnabled(result.skipPromotedPostsEnabled);
        if (result.skipFriendsActivitiesEnabled !== undefined)
          setSkipFriendsActivitiesEnabled(result.skipFriendsActivitiesEnabled);

        const commentAsCompanyEnabled =
          result.commentAsCompanyEnabled !== undefined
            ? result.commentAsCompanyEnabled
            : false;

        const blacklistEnabledLoaded = result.blacklistEnabled ?? false;
        const blacklistAuthorsLoaded = result.blacklistAuthors ?? "";
        setBlacklistEnabled(blacklistEnabledLoaded);
        setBlacklistAuthors(blacklistAuthorsLoaded);

        loadTodayComments();
      },
    );
  }, [isPremium, isPremiumLoading, maxPostsLimit]);

  // Listen for messages from background script
  useEffect(() => {
    const messageListener = async (
      request: any,
      sender: any,
      sendResponse: any,
    ) => {
      if (request.action === "statusUpdate") {
        setStatus(request.status);

        if (request.error) {
          setLastError(request.error);
          console.error("EngageKit Error Details:", request.error);
        }

        if (request.commentCount !== undefined) {
          setCommentCount(request.commentCount);
          chrome.storage.local.set({
            currentCommentCount: request.commentCount,
          });
        }
        if (request.isRunning !== undefined) {
          setIsRunning(request.isRunning);
          chrome.storage.local.set({ isRunning: request.isRunning });

          if (!request.isRunning && request.commentCount > 0) {
            const newAllTimeTotal = totalAllTimeComments + request.commentCount;
            const newTodayTotal = totalTodayComments + request.commentCount;
            setTotalAllTimeComments(newAllTimeTotal);
            setTotalTodayComments(newTodayTotal);
            chrome.storage.local.set({ totalAllTimeComments: newAllTimeTotal });
            saveTodayComments(newTodayTotal);
          }
        }
        if (request.newAllTimeTotal !== undefined) {
          setTotalAllTimeComments(request.newAllTimeTotal);
          chrome.storage.local.set({
            totalAllTimeComments: request.newAllTimeTotal,
          });
        }
        if (request.totalAllTimeComments !== undefined) {
          setTotalAllTimeComments(request.totalAllTimeComments);
          chrome.storage.local.set({
            totalAllTimeComments: request.totalAllTimeComments,
          });
        }
        if (request.newTodayTotal !== undefined) {
          setTotalTodayComments(request.newTodayTotal);
          saveTodayComments(request.newTodayTotal);
        }
      }
      if (request.action === "realTimeCountUpdate") {
        if (request.todayCount !== undefined) {
          setTotalTodayComments(request.todayCount);
          saveTodayComments(request.todayCount);
        }
        if (request.allTimeCount !== undefined) {
          setTotalAllTimeComments(request.allTimeCount);
          chrome.storage.local.set({
            totalAllTimeComments: request.allTimeCount,
          });
        }
        if (request.skippedCount !== undefined) {
          setPostsSkippedDuplicate(request.skippedCount);
          chrome.storage.local.set({
            postsSkippedDuplicate: request.skippedCount,
          });
        }
        if (request.recentAuthorsCount !== undefined) {
          setRecentAuthorsDetected(request.recentAuthorsCount);
          chrome.storage.local.set({
            recentAuthorsDetected: request.recentAuthorsCount,
          });
        }
        if (request.postsSkippedAlreadyCommentedCount !== undefined) {
          setPostsSkippedAlreadyCommented(
            request.postsSkippedAlreadyCommentedCount,
          );
          chrome.storage.local.set({
            postsSkippedAlreadyCommented:
              request.postsSkippedAlreadyCommentedCount,
          });
        }
        if (request.duplicatePostsDetectedCount !== undefined) {
          setDuplicatePostsDetected(request.duplicatePostsDetectedCount);
          chrome.storage.local.set({
            duplicatePostsDetected: request.duplicatePostsDetectedCount,
          });
        }
        if (request.postsSkippedTimeFilterCount !== undefined) {
          setPostsSkippedTimeFilter(request.postsSkippedTimeFilterCount);
          chrome.storage.local.set({
            postsSkippedTimeFilter: request.postsSkippedTimeFilterCount,
          });
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, [isPremium, isPremiumLoading, maxPostsLimit]);

  // Reset premium-only features when user is not premium
  useEffect(() => {
    if (!isPremiumLoading && isPremium === false) {
      const updates: Record<string, any> = {};

      if (commentAsCompanyEnabled) {
        setCommentAsCompanyEnabled(false);
        updates.commentAsCompanyEnabled = false;
      }

      if (languageAwareEnabled) {
        setLanguageAwareEnabled(false);
        updates.languageAwareEnabled = false;
      }

      if (skipCompanyPagesEnabled) {
        setSkipCompanyPagesEnabled(false);
        updates.skipCompanyPagesEnabled = false;
      }

      if (skipPromotedPostsEnabled) {
        setSkipPromotedPostsEnabled(false);
        updates.skipPromotedPostsEnabled = false;
      }

      if (skipFriendsActivitiesEnabled) {
        setSkipFriendsActivitiesEnabled(false);
        updates.skipFriendsActivitiesEnabled = false;
      }

      if (blacklistEnabled) {
        setBlacklistEnabled(false);
        updates.blacklistEnabled = false;
      }

      if (timeFilterEnabled) {
        setTimeFilterEnabled(false);
        updates.timeFilterEnabled = false;
      }

      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates);
      }
    }
  }, [isPremium, isPremiumLoading]);

  const loadTodayComments = () => {
    const today = new Date().toDateString();
    const storageKey = `comments_today_${today}`;
    chrome.storage.local.get([storageKey], (result) => {
      const todayCount = result[storageKey] || 0;
      setTotalTodayComments(todayCount);
    });
  };

  const saveTodayComments = (count: number) => {
    const today = new Date().toDateString();
    const storageKey = `comments_today_${today}`;
    chrome.storage.local.set({ [storageKey]: count });
  };

  // Utility helpers -----------------------------------------------------
  const isDefaultStyle = (key: string): boolean =>
    key in DEFAULT_STYLE_GUIDES_FREE || key in DEFAULT_STYLE_GUIDES_PREMIUM;

  const findCustomStyle = (name: string) =>
    customStyles.find((s) => s.name.toLowerCase() === name.toLowerCase());

  const getPromptForKey = (key: string): string => {
    if (isDefaultStyle(key)) {
      if (isPremium && key in DEFAULT_STYLE_GUIDES_PREMIUM) {
        const entry = (
          DEFAULT_STYLE_GUIDES_PREMIUM as Record<string, { prompt: string }>
        )[key];
        return entry?.prompt ?? DEFAULT_STYLE_GUIDES_FREE.PROFESSIONAL.prompt;
      }
      const freeEntry = (
        DEFAULT_STYLE_GUIDES_FREE as Record<string, { prompt: string }>
      )[key];
      return freeEntry?.prompt ?? DEFAULT_STYLE_GUIDES_FREE.PROFESSIONAL.prompt;
    }
    const cs = findCustomStyle(key);
    if (cs) return cs.prompt;
    // Fallback
    return DEFAULT_STYLE_GUIDES_FREE.PROFESSIONAL.prompt;
  };

  // --------------------------------------------------------------------

  const handleStyleGuideChange = (value: string) => {
    setStyleGuide(value);

    // Persist change for custom style if editing one
    if (!isDefaultStyle(selectedStyleKey)) {
      const updated = customStyles.map((s) =>
        s.name === selectedStyleKey ? { ...s, prompt: value } : s,
      );
      setCustomStyles(updated);
      chrome.storage.local.set({ customStyleGuides: updated });
    }

    chrome.storage.local.set({ styleGuide: value });
  };

  const handleSelectedStyleChange = (value: string) => {
    const newGuide = getPromptForKey(value);
    setSelectedStyleKey(value);
    setStyleGuide(newGuide);
    chrome.storage.local.set({ selectedStyleKey: value, styleGuide: newGuide });
  };

  // Add & delete custom styles -----------------------------------------
  const saveCustomStyles = (styles: CustomStyle[]) => {
    chrome.storage.local.set({ customStyleGuides: styles });
  };

  const addCustomStyle = () => {
    const nameRaw = prompt("Name your new style (≤50 characters)") ?? "";
    const name = nameRaw.trim();
    if (!name) return;
    if (name.length > 50) {
      alert("Style name too long (max 50)");
      return;
    }
    if (isDefaultStyle(name) || findCustomStyle(name)) {
      alert("Style name already exists. Choose another name.");
      return;
    }
    const newStyle: CustomStyle = { name, prompt: styleGuide };
    const updated = [...customStyles, newStyle];
    setCustomStyles(updated);
    setSelectedStyleKey(name);
    saveCustomStyles(updated);
  };

  const deleteCustomStyle = () => {
    if (isDefaultStyle(selectedStyleKey)) return;
    if (!confirm(`Delete style "${selectedStyleKey}"?`)) return;
    const updated = customStyles.filter((s) => s.name !== selectedStyleKey);
    setCustomStyles(updated);
    saveCustomStyles(updated);
    setSelectedStyleKey("PROFESSIONAL");
    setStyleGuide(getPromptForKey("PROFESSIONAL"));
  };

  const handleScrollDurationChange = (value: number) => {
    setScrollDuration(value);
    chrome.storage.local.set({ scrollDuration: value });
  };

  const handleCommentDelayChange = (value: number) => {
    setCommentDelay(value);
    chrome.storage.local.set({ commentDelay: value });
  };

  const handleMaxPostsChange = (value: number) => {
    setMaxPosts(value);
    chrome.storage.local.set({ maxPosts: value });
  };

  const handleDuplicateWindowChange = (value: number) => {
    console.log("Popup: Saving duplicateWindow:", value);
    setDuplicateWindow(value);
    chrome.storage.local.set({ duplicateWindow: value });
  };

  const handleTimeFilterEnabledChange = (value: boolean) => {
    setTimeFilterEnabled(value);
    chrome.storage.local.set({ timeFilterEnabled: value });
  };

  const handleMinPostAgeChange = (value: number) => {
    setMinPostAge(value);
    chrome.storage.local.set({ minPostAge: value });
  };

  const handleCommentProfileNameChange = (value: string) => {
    setCommentProfileName(value);
    chrome.storage.local.set({ commentProfileName: value });
  };

  const handleCommentAsCompanyEnabledChange = (value: boolean) => {
    setCommentAsCompanyEnabled(value);
    chrome.storage.local.set({ commentAsCompanyEnabled: value });
  };

  const handleLanguageAwareEnabledChange = (value: boolean) => {
    setLanguageAwareEnabled(value);
    chrome.storage.local.set({ languageAwareEnabled: value });
  };

  const handleSkipCompanyPagesEnabledChange = (value: boolean) => {
    setSkipCompanyPagesEnabled(value);
    chrome.storage.local.set({ skipCompanyPagesEnabled: value });
  };

  const handleSkipPromotedPostsEnabledChange = (value: boolean) => {
    setSkipPromotedPostsEnabled(value);
    chrome.storage.local.set({ skipPromotedPostsEnabled: value });
  };

  const handleSkipFriendsActivitiesEnabledChange = (value: boolean) => {
    setSkipFriendsActivitiesEnabled(value);
    chrome.storage.local.set({ skipFriendsActivitiesEnabled: value });
  };

  const handleBlacklistEnabledChange = (value: boolean) => {
    setBlacklistEnabled(value);
    chrome.storage.local.set({ blacklistEnabled: value });
  };

  const handleBlacklistAuthorsChange = (value: string) => {
    setBlacklistAuthors(value);
    chrome.storage.local.set({ blacklistAuthors: value });
  };

  // Removed handleSetDefaultStyleGuide – dropdown applies style directly

  const handleStart = async () => {
    // Prevent starting if critical data is still loading
    if (isInitialDataLoading) {
      setLastError({ message: "Data is still loading, please wait." });
      return;
    }

    // Check if daily limit is reached before starting
    if (isDailyLimitReached) {
      setLastError({
        message: (
          <>
            Daily comment limit reached. Please <UpgradeLink /> or wait until
            tomorrow.
          </>
        ),
      });
      return;
    }

    setStatus("Starting...");
    setLastError(null);

    if (!styleGuide.trim()) {
      setStatus("Please enter a style guide for your comments.");
      return;
    }

    // Verify user is signed in (tokens will be fetched fresh by background service)
    if (!isLoaded || !isSignedIn) {
      console.warn("Popup: Cannot start - not signed in");
      setStatus("Please sign in to start commenting.");
      return;
    }

    console.log("Popup: Starting with current state values:", {
      scrollDuration,
      commentDelay,
      maxPosts,
      duplicateWindow,
      styleGuide: styleGuide.substring(0, 50) + "...",
      isSignedIn,
    });

    setIsRunning(true);
    setCommentCount(0);
    setStatus("Starting LinkedIn auto-commenting...");

    try {
      const message = {
        action: "startAutoCommenting",
        styleGuide: styleGuide.trim(),
        scrollDuration,
        commentDelay,
        maxPosts,
        duplicateWindow,
        timeFilterEnabled,
        minPostAge,
      };

      console.log(
        "Popup: Sending message to background (tokens fetched on-demand)",
      );
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error("Error starting auto-commenting:", error);
      setStatus("Error starting the process. Please try again.");
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      if (commentCount > 0) {
        const newAllTimeTotal = totalAllTimeComments + commentCount;
        const newTodayTotal = totalTodayComments + commentCount;
        setTotalAllTimeComments(newAllTimeTotal);
        setTotalTodayComments(newTodayTotal);
        chrome.storage.local.set({ totalAllTimeComments: newAllTimeTotal });
        saveTodayComments(newTodayTotal);
      }

      await chrome.runtime.sendMessage({ action: "stopAutoCommenting" });
      setIsRunning(false);
      setStatus("Auto-commenting process stopped and reset.");
      setCommentCount(0);
      chrome.storage.local.set({ isRunning: false, currentCommentCount: 0 });
    } catch (error) {
      console.error("Error stopping auto-commenting:", error);
    }
  };

  // If user has never signed in, show sign-in UI (skip loading entirely)
  if (!hasEverSignedIn) return <Auth />;

  // If user has signed in before, show the authenticated UI immediately
  return (
    <div className="w-[500px] overflow-y-auto bg-white">
      {/* Show authenticated UI for returning users */}
      <div className="p-6">
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={engageKitLogo}
                alt="EngageKit Logo"
                className="h-8 w-8"
              />
              <h2 className="text-2xl font-bold text-gray-800">EngageKit</h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-green-600">Connected</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Hi boss {user?.firstName || "User"}! Let your AI intern engage on
            LinkedIn for you
          </p>

          {/* User Profile Section */}
          <UserProfile user={user} />

          {/* Comment Limit Status */}
          <CommentLimitStatus
            isPremium={isPremium}
            dailyCount={dailyCommentCount ?? 0}
            limit={dailyLimit}
            isLoading={isPremiumLoading || isDailyCountLoading}
          />

          <div className="mt-4 mb-4">
            {isRunning ? (
              <button
                onClick={handleStop}
                className="w-full rounded-md bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
              >
                Stop Auto Commenting
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                disabled={
                  isInitialDataLoading ||
                  !styleGuide.trim() ||
                  isDailyLimitReached ||
                  styleGuideTooLong
                }
              >
                Start Auto Commenting
              </button>
            )}
          </div>

          <StatisticsDashboard
            totalAllTimeComments={totalAllTimeComments}
            totalTodayComments={totalTodayComments}
            postsSkippedDuplicate={postsSkippedDuplicate}
            recentAuthorsDetected={recentAuthorsDetected}
            postsSkippedAlreadyCommented={postsSkippedAlreadyCommented}
            duplicatePostsDetected={duplicatePostsDetected}
            postsSkippedTimeFilter={postsSkippedTimeFilter}
          />
        </div>

        <RunningStatusBanner
          isRunning={isRunning}
          status={status}
          commentCount={commentCount}
          maxPosts={maxPosts}
        />

        <SettingsForm
          styleGuide={styleGuide}
          scrollDuration={scrollDuration}
          commentDelay={commentDelay}
          maxPosts={maxPosts}
          duplicateWindow={duplicateWindow}
          timeFilterEnabled={timeFilterEnabled}
          minPostAge={minPostAge}
          isRunning={isRunning}
          isPremium={isPremium}
          isPremiumLoading={isPremiumLoading}
          maxPostsLimit={maxPostsLimit}
          selectedStyleKey={selectedStyleKey}
          customStyles={customStyles}
          onSelectedStyleChange={handleSelectedStyleChange}
          onAddCustomStyle={addCustomStyle}
          onDeleteCustomStyle={deleteCustomStyle}
          isDefaultStyleSelected={isDefaultStyle(selectedStyleKey)}
          commentProfileName={commentProfileName}
          onCommentProfileNameChange={handleCommentProfileNameChange}
          commentAsCompanyEnabled={commentAsCompanyEnabled}
          onCommentAsCompanyEnabledChange={handleCommentAsCompanyEnabledChange}
          languageAwareEnabled={languageAwareEnabled}
          onLanguageAwareEnabledChange={handleLanguageAwareEnabledChange}
          skipCompanyPagesEnabled={skipCompanyPagesEnabled}
          onSkipCompanyPagesEnabledChange={handleSkipCompanyPagesEnabledChange}
          skipPromotedPostsEnabled={skipPromotedPostsEnabled}
          onSkipPromotedPostsEnabledChange={
            handleSkipPromotedPostsEnabledChange
          }
          skipFriendsActivitiesEnabled={skipFriendsActivitiesEnabled}
          onSkipFriendsActivitiesEnabledChange={
            handleSkipFriendsActivitiesEnabledChange
          }
          onStyleGuideChange={handleStyleGuideChange}
          onScrollDurationChange={handleScrollDurationChange}
          onCommentDelayChange={handleCommentDelayChange}
          onMaxPostsChange={handleMaxPostsChange}
          onDuplicateWindowChange={handleDuplicateWindowChange}
          onTimeFilterEnabledChange={handleTimeFilterEnabledChange}
          onMinPostAgeChange={handleMinPostAgeChange}
          blacklistEnabled={blacklistEnabled}
          blacklistAuthors={blacklistAuthors}
          onBlacklistEnabledChange={handleBlacklistEnabledChange}
          onBlacklistAuthorsChange={handleBlacklistAuthorsChange}
        />

        {status && !isRunning && (
          <div className="mb-4 rounded-md border-l-4 border-blue-500 bg-gray-100 p-3 text-sm text-gray-700">
            {status}
          </div>
        )}

        <ErrorDisplay
          lastError={lastError}
          onClearError={() => setLastError(null)}
        />
      </div>
    </div>
  );
}
