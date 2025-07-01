export default function Auth() {
  const handleSignInClick = () => {
    const syncHostUrl = getSyncHostUrl();
    const authUrl = `${syncHostUrl}/extension-auth`;
    chrome.tabs.create({ url: authUrl });
  };

  const handleRefreshAuth = () => {
    // Force a refresh of the authentication state
    window.location.reload();
  };

  // Determine sync host URL for opening auth
  const getSyncHostUrl = () => {
    // For development
    if (import.meta.env.VITE_NGROK_URL) {
      return import.meta.env.VITE_NGROK_URL;
    }

    // Default to localhost for development
    return "http://localhost:3000";
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
