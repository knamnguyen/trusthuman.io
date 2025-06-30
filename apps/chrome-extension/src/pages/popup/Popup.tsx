import React, { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  useAuth,
  useClerk,
  useUser,
} from "@clerk/chrome-extension";

// Default comment style guide
const DEFAULT_STYLE_GUIDE = `You are about to write a LinkedIn comment. Imagine you are a young professional or ambitious student (Gen Z), scrolling through your LinkedIn feed during a quick break – maybe between classes, on your commute, or while grabbing a coffee. You're sharp, interested in tech, business, career growth, personal development, social impact, product, marketing, or entrepreneurship. You appreciate authentic, slightly edgy, and insightful content.

IMPORTANT: Only respond with the comment, no other text.`;

// Default API key
const DEFAULT_API_KEY = "AIzaSyBFpuCTgTgJ7PqfYvl3S29mTc1B1oHe1wI";

// Determine sync host URL for opening auth
const getSyncHostUrl = () => {
  // For development
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }

  // Default to localhost for development
  return "http://localhost:3000";
};

export default function Popup() {
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const [styleGuide, setStyleGuide] = useState("");
  const [apiKey, setApiKey] = useState("");
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
  const [hasEverSignedIn, setHasEverSignedIn] = useState(false);

  // Load simple auth state on mount
  useEffect(() => {
    chrome.storage.local.get(["hasEverSignedIn"], (result) => {
      if (result.hasEverSignedIn) {
        setHasEverSignedIn(true);
      }
    });
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

        if (result.apiKey !== undefined) setApiKey(result.apiKey);
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
    const messageListener = (request: any, sender: any, sendResponse: any) => {
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

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    chrome.storage.local.set({ apiKey: value });
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

  const handleSetDefaultApiKey = () => {
    setApiKey(DEFAULT_API_KEY);
    chrome.storage.local.set({ apiKey: DEFAULT_API_KEY });
  };

  const handleSignInClick = () => {
    const syncHostUrl = getSyncHostUrl();
    const authUrl = `${syncHostUrl}/extension-auth`;
    chrome.tabs.create({ url: authUrl });
  };

  const handleRefreshAuth = () => {
    // Force a refresh of the authentication state
    window.location.reload();
  };

  const handleStart = async () => {
    if (!styleGuide.trim()) {
      setStatus("Please enter a style guide for your comments.");
      return;
    }

    if (!apiKey.trim()) {
      setStatus("Please enter your Google AI Studio API key.");
      return;
    }

    console.log("Popup: Starting with current state values:", {
      scrollDuration,
      commentDelay,
      maxPosts,
      duplicateWindow,
      styleGuide: styleGuide.substring(0, 50) + "...",
      hasApiKey: !!apiKey,
    });

    setIsRunning(true);
    setCommentCount(0);
    setStatus("Starting LinkedIn auto-commenting...");

    try {
      const message = {
        action: "startAutoCommenting",
        styleGuide: styleGuide.trim(),
        apiKey: apiKey.trim(),
        scrollDuration,
        commentDelay,
        maxPosts,
        duplicateWindow,
        timeFilterEnabled,
        minPostAge,
      };

      console.log("Popup: Sending message to background:", message);
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
  if (!hasEverSignedIn) {
    return (
      <div className="h-[800px] w-[500px] overflow-y-auto bg-white">
        <div className="flex h-full items-center justify-center">
          <div className="p-6 text-center">
            <div className="mb-6">
              <h2 className="mb-3 text-2xl font-bold text-gray-800">
                EngageKit
              </h2>
              <p className="text-sm text-gray-600">
                Automatically comment on LinkedIn posts using AI
              </p>
            </div>

            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                🔐 Authentication Required
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Sign in to your EngageKit account to start using the extension
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleSignInClick}
                  className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Sign In to EngageKit
                </button>

                <button
                  onClick={handleRefreshAuth}
                  className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Already signed in? Refresh
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                This will open the EngageKit web app for secure authentication
              </p>
            </div>

            <div className="text-xs text-gray-500">
              <p className="mb-1 font-medium text-gray-600">
                ✨ Features available after sign in:
              </p>
              <ul className="text-left">
                <li>• AI-powered LinkedIn commenting</li>
                <li>• Customizable comment styles</li>
                <li>• Usage analytics and tracking</li>
                <li>• Smart duplicate detection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user has signed in before, show the authenticated UI immediately
  return (
    <div className="h-[800px] w-[500px] overflow-y-auto bg-white">
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
            Welcome {user?.firstName || "User"}! Automatically comment on
            LinkedIn posts using AI
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
              <div className="text-lg font-bold text-green-700">
                {totalAllTimeComments}
              </div>
              <div className="text-xs leading-tight text-green-600">
                🎉 Total comments all-time
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
              <div className="text-lg font-bold text-blue-700">
                {totalTodayComments}
              </div>
              <div className="text-xs leading-tight text-blue-600">
                📅 Comments posted today
              </div>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
              <div className="text-lg font-bold text-orange-700">
                {postsSkippedDuplicate}
              </div>
              <div className="text-xs leading-tight text-orange-600">
                ⏭️ Posts skipped (author filter)
              </div>
            </div>
          </div>
        </div>

        {isRunning && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                🚀 LinkedIn commenting running
              </span>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-600">
                  📝 {commentCount}/{maxPosts}
                </span>
              </div>
            </div>
            <div className="mb-2 text-xs text-blue-700">{status}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-600">
                This session: {commentCount}
              </span>
              <span className="text-blue-600">Target: {maxPosts} posts</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Google AI Studio API Key:
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="Enter your Google AI Studio API key"
            className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
            <button
              onClick={handleSetDefaultApiKey}
              disabled={isRunning}
              className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use Default API Key
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Comment Style Guide:
          </label>
          <textarea
            value={styleGuide}
            onChange={(e) => handleStyleGuideChange(e.target.value)}
            placeholder="Describe your commenting style... e.g., 'Professional but friendly, ask thoughtful questions, share relevant insights, keep responses under 50 words, add value to the conversation'"
            className="h-20 w-full resize-none rounded-md border border-gray-300 p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSetDefaultStyleGuide}
              disabled={isRunning}
              className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use Default Style
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Feed Scroll Duration:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="5"
              max="30"
              value={scrollDuration}
              onChange={(e) =>
                handleScrollDurationChange(parseInt(e.target.value))
              }
              disabled={isRunning}
              className="flex-1"
            />
            <span className="w-16 text-sm font-medium">{scrollDuration}s</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Time to scroll the feed to load more posts
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Max Posts to Comment On:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="5"
              max="50"
              value={maxPosts}
              onChange={(e) => handleMaxPostsChange(parseInt(e.target.value))}
              disabled={isRunning}
              className="flex-1"
            />
            <span className="w-16 text-sm font-medium">{maxPosts}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Maximum number of posts to comment on in one session
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Seconds Between Each Comment:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="5"
              max="60"
              value={commentDelay}
              onChange={(e) =>
                handleCommentDelayChange(parseInt(e.target.value))
              }
              disabled={isRunning}
              className="flex-1"
            />
            <span className="w-16 text-sm font-medium">{commentDelay}s</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Delay between processing each post to avoid being flagged
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Duplicate Check Window:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="72"
              value={duplicateWindow}
              onChange={(e) =>
                handleDuplicateWindowChange(parseInt(e.target.value))
              }
              disabled={isRunning}
              className="flex-1"
            />
            <span className="w-16 text-sm font-medium">{duplicateWindow}h</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Skip authors you've commented on within this time window
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Post Age Filter:
          </label>
          <div className="mb-2 flex items-center space-x-3">
            <input
              type="checkbox"
              id="timeFilterEnabled"
              checked={timeFilterEnabled}
              onChange={(e) => handleTimeFilterEnabledChange(e.target.checked)}
              disabled={isRunning}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="timeFilterEnabled"
              className="text-sm text-gray-700"
            >
              Only comment on posts made within:
            </label>
            <div className="flex flex-1 items-center space-x-2">
              <input
                type="range"
                min="1"
                max="24"
                value={minPostAge}
                onChange={(e) =>
                  handleMinPostAgeChange(parseInt(e.target.value))
                }
                disabled={isRunning || !timeFilterEnabled}
                className="flex-1"
              />
              <span className="w-12 text-sm font-medium">{minPostAge}h</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, skips posts older than the specified time and promoted
            posts
          </p>
        </div>

        <div className="mb-4">
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
              disabled={!styleGuide.trim() || !apiKey.trim()}
            >
              Start Auto Commenting
            </button>
          )}
        </div>

        {status && !isRunning && (
          <div className="mb-4 rounded-md border-l-4 border-blue-500 bg-gray-100 p-3 text-sm text-gray-700">
            {status}
          </div>
        )}

        {lastError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-red-800">
                🐛 Debug Info
              </span>
              <button
                onClick={() => setLastError(null)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                ✕ Clear
              </button>
            </div>
            <div className="space-y-1 text-xs text-red-700">
              <div>
                <strong>Message:</strong> {lastError.message}
              </div>
              {lastError.status && (
                <div>
                  <strong>Status:</strong> {lastError.status} -{" "}
                  {lastError.statusText}
                </div>
              )}
              {lastError.apiKey && (
                <div>
                  <strong>API Key:</strong> {lastError.apiKey}
                </div>
              )}
              {lastError.styleGuide && (
                <div>
                  <strong>Style Guide:</strong> {lastError.styleGuide}
                </div>
              )}
              {lastError.postContentLength !== undefined && (
                <div>
                  <strong>Post Length:</strong> {lastError.postContentLength}{" "}
                  chars
                </div>
              )}
              {lastError.body && (
                <div className="mt-2">
                  <strong>Response:</strong>
                  <pre className="mt-1 max-h-20 overflow-x-auto rounded bg-red-100 p-2 text-xs">
                    {typeof lastError.body === "string"
                      ? lastError.body
                      : JSON.stringify(lastError.body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            Settings Summary:
          </h3>
          <ul className="mb-3 space-y-1 text-xs text-gray-600">
            <li>• Feed scroll: {scrollDuration}s</li>
            <li>• Max posts: {maxPosts}</li>
            <li>• Comment delay: {commentDelay}s between posts</li>
            <li>• Duplicate window: {duplicateWindow}h</li>
            <li>
              • Time filter:{" "}
              {timeFilterEnabled ? `${minPostAge}h max age` : "disabled"}
            </li>
          </ul>
          <div className="text-xs text-gray-500">
            <p className="mb-1 font-medium text-gray-600">
              ⚠️ Use responsibly:
            </p>
            <p className="mb-2">
              Monitor posted comments and ensure they add value to conversations
            </p>
          </div>

          {/* User Profile Section */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.primaryEmailAddress?.emailAddress || "Loading..."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Clear auth state and sign out
                  chrome.storage.local.set({ hasEverSignedIn: false });
                  setHasEverSignedIn(false);
                  clerk.signOut();
                }}
                className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
