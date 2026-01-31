import { NextResponse } from 'next/server';

/**
 * OAuth bridge for Capacitor mobile app
 *
 * Flow:
 * 1. Clerk redirects here (HTTPS) after Google OAuth
 * 2. This page extracts OAuth params from URL
 * 3. JavaScript redirects to custom scheme: capacitordemo://oauth/callback
 * 4. iOS opens the app via deep link
 * 5. AppUrlListener catches the deep link and completes sign-in
 */
export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting to App...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .loader {
      text-align: center;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Opening EngageKit...</p>
  </div>
  <script>
    // Extract OAuth params from HTTPS URL
    const params = new URLSearchParams(window.location.search);

    // Redirect to custom scheme with same params
    const deepLink = 'capacitordemo://oauth/callback?' + params.toString();

    console.log('[OAuth Bridge] Redirecting to:', deepLink);

    // Attempt to open the app
    window.location.href = deepLink;

    // Show error if app doesn't open after 3 seconds
    setTimeout(() => {
      document.body.innerHTML = '<div style="text-align:center;padding:20px;"><p>Unable to open app. Please ensure EngageKit is installed.</p></div>';
    }, 3000);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
