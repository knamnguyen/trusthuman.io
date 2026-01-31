import React from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Button } from '@sassy/ui/button';

/**
 * SignInButton - Google OAuth sign-in
 *
 * Now that redirect URLs are configured in Clerk dashboard,
 * the standard authenticateWithRedirect should work.
 *
 * Flow:
 * 1. User clicks button
 * 2. Clerk's authenticateWithRedirect opens system browser
 * 3. User signs in to Google
 * 4. Redirects to https://engagekit.io/api/mobile-oauth-callback
 * 5. That redirects to capacitordemo://oauth/callback
 * 6. App catches deep link
 * 7. OAuthCallbackPage completes session
 */
export const SignInButton: React.FC = () => {
  const { signIn } = useSignIn();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    if (!signIn) {
      console.error('[SignInButton] signIn is not available');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[SignInButton] Starting Google OAuth with authenticateWithRedirect...');

      // Now that redirect URLs are configured in Clerk Native applications,
      // this should work properly
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: 'https://engagekit.io/api/mobile-oauth-callback',
        redirectUrlComplete: '/dashboard',
      });

      console.log('[SignInButton] Redirect initiated');

    } catch (error: any) {
      console.error('[SignInButton] OAuth error:', error);

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
