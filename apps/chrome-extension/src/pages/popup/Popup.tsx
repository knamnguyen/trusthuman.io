import React, { useEffect, useState } from "react";

import { useBackgroundAuth } from "../../hooks/use-background-auth";
import { clearCachedUserData } from "../../hooks/use-user-data";
import Auth from "./components/auth";
import ErrorDisplay from "./components/error-display";
import RunningStatusBanner from "./components/running-status-banner";
import SettingsForm from "./components/settings-form";
import StatisticsDashboard from "./components/statistics-dashboard";
import UserProfile from "./components/user-profile";

// Default comment style guide
const DEFAULT_STYLE_GUIDE = `You are about to write a LinkedIn comment. Imagine you are a young professional or ambitious student (Gen Z), scrolling through your LinkedIn feed during a quick break – maybe between classes, on your commute, or while grabbing a coffee. You're sharp, interested in tech, business, career growth, personal development, social impact, product, marketing, or entrepreneurship. You appreciate authentic, slightly edgy, and insightful content.

IMPORTANT: Only respond with the comment, no other text.`;

export default function Popup() {
  const { user, isLoaded, isSignedIn, signOut, isSigningOut } =
    useBackgroundAuth();
  const [styleGuide, setStyleGuide] = useState("");
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
  const [lastError, setLastError] = useState<any>(null);

  // Simple auth state tracking
  const [hasEverSignedIn, setHasEverSignedIn] = useState<boolean>(false);

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
      clearCachedUserData();
    }
  }, [isLoaded, isSignedIn, hasEverSignedIn]);

  // Load saved data from storage on component mount
  useEffect(() => {
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
      ],
      (result) => {
        console.log("Popup: Loading settings from storage:", result);

        if (result.styleGuide !== undefined) setStyleGuide(result.styleGuide);
        if (result.scrollDuration !== undefined)
          setScrollDuration(result.scrollDuration);
        if (result.commentDelay !== undefined)
          setCommentDelay(result.commentDelay);
        if (result.maxPosts !== undefined) setMaxPosts(result.maxPosts);
        if (result.duplicateWindow !== undefined)
          setDuplicateWindow(result.duplicateWindow);
        if (result.timeFilterEnabled !== undefined)
          setTimeFilterEnabled(result.timeFilterEnabled);
        if (result.minPostAge !== undefined) setMinPostAge(result.minPostAge);
        if (result.totalAllTimeComments !== undefined)
          setTotalAllTimeComments(result.totalAllTimeComments);
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

        if (result.isRunning !== undefined) setIsRunning(result.isRunning);
        if (result.currentCommentCount !== undefined)
          setCommentCount(result.currentCommentCount);

        console.log(
          "Popup: Settings loaded - maxPosts:",
          result.maxPosts,
          "scrollDuration:",
          result.scrollDuration,
          "commentDelay:",
          result.commentDelay,
          "duplicateWindow:",
          result.duplicateWindow,
        );
      },
    );

    loadTodayComments();

    // Listen for status updates from background script
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
      } else if (request.action === "realTimeCountUpdate") {
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
  }, [totalAllTimeComments, totalTodayComments]);

  const loadTodayComments = () => {
    const todayKey = `comments_today_${new Date().toDateString()}`;
    chrome.storage.local.get([todayKey], (result) => {
      const todayCount = result[todayKey] || 0;
      setTotalTodayComments(todayCount);
    });
  };

  const saveTodayComments = (count: number) => {
    const todayKey = `comments_today_${new Date().toDateString()}`;
    chrome.storage.local.set({ [todayKey]: count });
  };

  const handleStyleGuideChange = (value: string) => {
    setStyleGuide(value);
    chrome.storage.local.set({ styleGuide: value });
  };

  const handleScrollDurationChange = (value: number) => {
    console.log("Popup: Saving scrollDuration:", value);
    setScrollDuration(value);
    chrome.storage.local.set({ scrollDuration: value });
  };

  const handleCommentDelayChange = (value: number) => {
    console.log("Popup: Saving commentDelay:", value);
    setCommentDelay(value);
    chrome.storage.local.set({ commentDelay: value });
  };

  const handleMaxPostsChange = (value: number) => {
    console.log("Popup: Saving maxPosts:", value);
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

  const handleSetDefaultStyleGuide = () => {
    setStyleGuide(DEFAULT_STYLE_GUIDE);
    chrome.storage.local.set({ styleGuide: DEFAULT_STYLE_GUIDE });
  };

  const handleStart = async () => {
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
            <h2 className="text-2xl font-bold text-gray-800">EngageKit</h2>
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
                disabled={!styleGuide.trim()}
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
          onStyleGuideChange={handleStyleGuideChange}
          onScrollDurationChange={handleScrollDurationChange}
          onCommentDelayChange={handleCommentDelayChange}
          onMaxPostsChange={handleMaxPostsChange}
          onDuplicateWindowChange={handleDuplicateWindowChange}
          onTimeFilterEnabledChange={handleTimeFilterEnabledChange}
          onMinPostAgeChange={handleMinPostAgeChange}
          onSetDefaultStyleGuide={handleSetDefaultStyleGuide}
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
