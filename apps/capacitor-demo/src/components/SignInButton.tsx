import React from 'react';
import { useClerk } from '@clerk/clerk-react';
import { Button } from '@sassy/ui/button';

/**
 * SignInButton - Google OAuth sign-in using Safari browser
 *
 * Flow:
 * 1. User clicks button
 * 2. We get OAuth URL from Clerk
 * 3. Open Safari with @capacitor/browser plugin
 * 4. User signs in to Google (one-tap if already logged in)
 * 5. Google redirects to capacitordemo://oauth/callback
 * 6. AppUrlListener catches the deep link
 * 7. OAuthCallbackPage completes the session
 */
export const SignInButton: React.FC = () => {
  const clerk = useClerk();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      console.log('[SignInButton] Starting Google OAuth...');

      // Use HTTPS bridge URL that redirects to custom scheme
      // Clerk → https://engagekit.io/api/mobile-oauth-callback → capacitordemo://
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: 'https://engagekit.io/api/mobile-oauth-callback',
        redirectUrlComplete: '/dashboard',
      });

      // In web, this redirects automatically
      // In Capacitor, it opens Safari which then redirects back to our app

    } catch (error: any) {
      console.error('[SignInButton] OAuth error:', error);

      // Log the full error for debugging
      if (error.errors) {
        console.error('[SignInButton] Clerk errors:', JSON.stringify(error.errors));
      }

      alert(`Sign-in failed: ${error.errors?.[0]?.message || error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? 'Opening browser...' : 'Sign in with Google'}
    </Button>
  );
};
