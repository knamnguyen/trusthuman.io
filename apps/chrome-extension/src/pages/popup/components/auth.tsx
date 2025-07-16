import { getSyncHost } from "@src/utils/get-sync-host";

import { getSyncHostUrl } from "../../../utils/url";

export default function Auth() {
  const handleSignInClick = () => {
    const syncHostUrl = getSyncHostUrl();
    // const syncHostUrl = getSyncHost();
    console.log("HANDLE SIGN IN CLICK", syncHostUrl);

    console.log("syncHostUrl clicked button", syncHostUrl);
    const authUrl = `${syncHostUrl}/extension-auth`;
    chrome.tabs.create({ url: authUrl });
  };

  const handleRefreshAuth = async () => {
    // Force background service to check auth status
    try {
      console.log("Auth: Forcing background auth status check...");
      const response = await chrome.runtime.sendMessage({
        action: "getAuthStatus",
      });
      console.log("Auth: Background auth check result:", response?.isSignedIn);

      // If signed in, reload the popup to show authenticated state
      if (response?.isSignedIn) {
        window.location.reload();
      } else {
        // Show feedback that user is still not signed in
        alert(
          "Still not signed in. Please complete sign-in in the web app first, then try again.",
        );
      }
    } catch (error) {
      console.error("Auth: Error checking auth status:", error);
      // Fallback to full reload
      window.location.reload();
    }
  };

  return (
    <>
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

                {/* Debug buttons - only visible in development */}
                {import.meta.env.DEV && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          console.log(
                            "Auth: Debug - Checking service worker status",
                          );
                          const response = await chrome.runtime.sendMessage({
                            action: "getAuthStatus",
                          });
                          console.log(
                            "Auth: Debug - Service worker response:",
                            response,
                          );
                          alert(
                            JSON.stringify(
                              {
                                isSignedIn: response?.isSignedIn,
                                hasUser: !!response?.user,
                                userId: response?.user?.id,
                                firstName: response?.user?.firstName,
                              },
                              null,
                              2,
                            ),
                          );
                        } catch (error) {
                          console.error("Auth: Debug - Error:", error);
                          alert("Error: " + String(error));
                        }
                      }}
                      className="w-full rounded-md bg-red-100 px-4 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                    >
                      Debug: Check Service Worker
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          // Force auth state to true for testing
                          chrome.storage.local.set(
                            { hasEverSignedIn: true },
                            () => {
                              console.log(
                                "Auth: Debug - Set hasEverSignedIn to true",
                              );
                              window.location.reload();
                            },
                          );
                        } catch (error) {
                          console.error("Auth: Debug - Error:", error);
                          alert("Error: " + String(error));
                        }
                      }}
                      className="w-full rounded-md bg-orange-100 px-4 py-2 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200"
                    >
                      Debug: Force Sign In State
                    </button>
                  </>
                )}
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
    </>
  );
}
