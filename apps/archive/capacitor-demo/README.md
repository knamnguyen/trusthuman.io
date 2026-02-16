# EngageKit Capacitor Demo

A demonstration of Clerk authentication with Google OAuth in a Capacitor mobile app.

## Overview

This app demonstrates:
- ✅ Clerk authentication in Capacitor
- ✅ Google sign-in via Safari (system browser)
- ✅ Deep link OAuth callbacks
- ✅ Session management in mobile webview
- ✅ Integration with monorepo infrastructure

## Architecture

```
User taps "Sign in"
  ↓
Safari opens for Google OAuth (not webview)
  ↓
User signs in (one-tap if already logged in)
  ↓
Deep link: capacitordemo://oauth/callback
  ↓
App receives callback → Session created
  ↓
User lands on dashboard
```

## Prerequisites

- macOS with Xcode installed
- Node.js >= 22.11.0
- pnpm >= 10.6.3
- iPhone (for device testing)

## Quick Start

### 1. Development Server

```bash
# From monorepo root
pnpm dev:capacitor

# Or from app directory
cd apps/capacitor-demo
pnpm dev
```

The dev server runs on `http://localhost:5173`

### 2. Build for iOS

```bash
cd apps/capacitor-demo

# Build the web app
pnpm build

# Sync to iOS (copies dist/ to ios/)
pnpm sync:ios

# Open in Xcode
pnpm open:ios
```

### 3. Run on iPhone

**Option A: Using Xcode**
1. Connect iPhone via USB
2. Open Xcode (`pnpm open:ios`)
3. Select your iPhone from device dropdown
4. Click ▶️ Run

**Option B: Using CLI**
```bash
pnpm run:ios
```

## iPhone Setup

### First Time Setup

1. **Trust Developer Certificate**
   - Settings → General → VPN & Device Management
   - Find your Apple Developer account
   - Tap "Trust"

2. **Allow App Installation**
   - When prompted on iPhone, tap "Allow"

### Code Signing

In Xcode:
1. Select "App" target
2. Go to "Signing & Capabilities"
3. Select your Apple Developer Team
4. Ensure "Automatically manage signing" is checked
5. Change Bundle ID if needed: `io.engagekit.demo.yourname`

## Deep Link Configuration

### iOS (Info.plist)

Already configured in `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>io.engagekit.demo</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>capacitordemo</string>
    </array>
  </dict>
</array>
```

This allows the app to handle URLs like: `capacitordemo://oauth/callback`

### Clerk Dashboard Configuration

**Required**: Add redirect URL to Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to: **Paths & URLs** → **Redirect URLs**
4. Add: `capacitordemo://oauth/callback`
5. Save

Without this, Clerk will reject the OAuth redirect for security.

## Development Workflow

### Live Reload on Device

To enable live reload during development:

1. Find your computer's local IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://192.168.1.XXX:5173',  // Your IP
     cleartext: true,
   }
   ```

3. Start dev server:
   ```bash
   pnpm dev
   ```

4. Sync and run:
   ```bash
   pnpm sync:ios
   pnpm run:ios
   ```

The app will now load from your dev server with live reload!

### Production Build

For production builds (no live reload):

1. Comment out `server.url` in `capacitor.config.ts`
2. Build: `pnpm build`
3. Sync: `pnpm sync:ios`
4. Run in Xcode

## Project Structure

```
apps/capacitor-demo/
├── src/
│   ├── components/
│   │   ├── AppUrlListener.tsx    # Deep link handler
│   │   ├── SignInButton.tsx      # Google OAuth button
│   │   └── ProtectedRoute.tsx    # Auth guard
│   ├── pages/
│   │   ├── HomePage.tsx          # Landing page
│   │   ├── SignInPage.tsx        # Auth screen
│   │   ├── DashboardPage.tsx     # Post-auth
│   │   └── OAuthCallbackPage.tsx # OAuth handler
│   ├── App.tsx                   # Root component
│   ├── router.tsx                # React Router config
│   └── main.tsx                  # Entry point
├── ios/                          # Capacitor iOS project
│   └── App/
│       └── App/
│           └── Info.plist        # Deep link config
├── dist/                         # Build output
├── capacitor.config.ts           # Capacitor config
├── vite.config.ts               # Vite config
└── package.json
```

## Key Files

### capacitor.config.ts
Configures app ID, schemes, and plugins:
```typescript
{
  appId: 'io.engagekit.demo',
  webDir: 'dist',
  server: {
    iosScheme: 'https',  // Required for OAuth
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,  // Required for sessions
    },
  },
}
```

### src/components/AppUrlListener.tsx
Listens for deep links from iOS and navigates to the appropriate route:
```typescript
App.addListener('appUrlOpen', (event) => {
  const path = new URL(event.url).pathname + search;
  navigate(path);
});
```

### src/components/SignInButton.tsx
Initiates OAuth flow by opening Safari:
```typescript
await clerk.client.signIn.authenticateWithRedirect({
  strategy: 'oauth_google',
  redirectUrl: 'capacitordemo://oauth/callback',
});
```

### src/pages/OAuthCallbackPage.tsx
Completes OAuth exchange after deep link redirect:
```typescript
// Wait for Clerk to create session
const session = await clerk.client.sessions.getCurrent();
await clerk.setActive({ session: session.id });
navigate('/dashboard');
```

## Environment Variables

Required in `.env`:

```bash
# Clerk (already configured in root .env)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_FRONTEND_API=...

# Optional: API URL for tRPC integration
VITE_API_URL=http://localhost:3000/api/trpc
```

## Troubleshooting

### Safari Doesn't Open

**Issue**: Tapping sign-in button does nothing

**Solutions**:
1. Check browser logs: `console.log` in SignInButton
2. Verify `@capacitor/browser` is installed
3. Test on real device (simulator may not support Browser plugin)

### Deep Link Not Working

**Issue**: Safari redirects but app doesn't open

**Solutions**:
1. Verify `CFBundleURLSchemes` in Info.plist
2. Check Clerk redirect URL is allowlisted
3. Rebuild app after Info.plist changes
4. Test deep link manually: `xcrun simctl openurl booted capacitordemo://test`

### Session Not Persisting

**Issue**: User signed out after closing app

**Solutions**:
1. Verify `CapacitorCookies` is enabled in config
2. Check Clerk session storage (localStorage)
3. Test on real device (simulator storage may differ)

### Build Errors

**Issue**: TypeScript or build errors

**Solutions**:
1. Clear cache: `pnpm clean`
2. Reinstall: `pnpm install`
3. Check Node version: `node -v` (should be >= 22.11.0)

### Xcode Signing Errors

**Issue**: Code signing failed

**Solutions**:
1. Select your Team in Signing & Capabilities
2. Change Bundle ID to be unique
3. Trust certificate on device (Settings → General → VPN & Device Management)

## Scripts Reference

```bash
# Development
pnpm dev              # Start Vite dev server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Capacitor
pnpm sync             # Sync web assets to native
pnpm sync:ios         # Sync to iOS only
pnpm open:ios         # Open Xcode
pnpm run:ios          # Build and run on device/simulator

# Utility
pnpm typecheck        # Check TypeScript
pnpm clean            # Clean build artifacts
```

## Testing OAuth Flow

### Manual Test Steps

1. ✅ Launch app on iPhone
2. ✅ Tap "Get Started" → "Sign in with Google"
3. ✅ Safari opens
4. ✅ Google sign-in page loads
5. ✅ Select Google account or sign in
6. ✅ Safari shows "Opening in EngageKit Demo"
7. ✅ App opens via deep link
8. ✅ Loading screen shows
9. ✅ Dashboard loads with user info
10. ✅ User name and email displayed

### Expected Console Logs

```
[AppUrlListener] Deep link opened: capacitordemo://oauth/callback?code=...
[AppUrlListener] Navigating to: /oauth/callback?code=...
[OAuthCallback] Processing OAuth callback...
[OAuthCallback] OAuth code received, completing sign-in...
[OAuthCallback] Active session found, setting as active...
[OAuthCallback] Session set, navigating to dashboard...
```

## Known Limitations

1. **No Hot Module Replacement (HMR)**: Changes require full page reload on device
2. **OAuth URL Scheme**: Must use custom scheme (capacitordemo://), not https://
3. **Clerk UI Components**: Prebuilt components don't work, must use custom UI
4. **Simulator vs Device**: Some features only work on real devices

## Next Steps

- [ ] Add Apple sign-in (required for App Store)
- [ ] Implement email/password authentication
- [ ] Add biometric authentication (Face ID/Touch ID)
- [ ] Integrate tRPC for API calls
- [ ] Add push notifications
- [ ] Configure Android support

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [Clerk React Documentation](https://clerk.com/docs/references/react)
- [Clerk OAuth Flows](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Capacitor logs in Xcode
- Check browser console in Safari Web Inspector

## License

Same as parent monorepo.
