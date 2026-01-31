import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { Button } from '@sassy/ui/button';

/**
 * OAuthCallbackPage - Handles the OAuth redirect from Google
 *
 * When Google redirects to capacitordemo://oauth/callback?code=xyz,
 * this page completes the OAuth exchange with Clerk and creates the session.
 */
export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[OAuthCallback] Processing OAuth callback...');

        // Get the OAuth code from URL params
        const code = searchParams.get('code');

        if (!code) {
          throw new Error('Missing OAuth code parameter');
        }

        console.log('[OAuthCallback] OAuth code received, completing sign-in...');

        // Clerk automatically handles the OAuth callback when the URL contains
        // the code and state parameters. We need to wait for the session to be created.

        // Try to get the active session
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds total
        const delayMs = 500;

        while (attempts < maxAttempts) {
          const session = clerk.client.sessions.find(s => s.status === 'active');

          if (session) {
            console.log('[OAuthCallback] Active session found, setting as active...');
            await clerk.setActive({ session: session.id });
            console.log('[OAuthCallback] Session set, navigating to dashboard...');
            navigate('/dashboard', { replace: true });
            return;
          }

          // Wait before trying again
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempts++;

          console.log(`[OAuthCallback] Waiting for session... (attempt ${attempts}/${maxAttempts})`);
        }

        throw new Error('Session creation timed out. Please try signing in again.');

      } catch (err) {
        console.error('[OAuthCallback] Error processing callback:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, clerk]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="text-6xl">❌</div>
          <div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Sign-in Failed</h1>
            <p className="text-gray-700">{error}</p>
          </div>
          <Button onClick={() => navigate('/signin')} className="w-full" size="lg">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="text-center space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing sign-in...
          </h2>
          <p className="text-gray-600">
            {isProcessing ? 'Creating your session' : 'Almost there!'}
          </p>
        </div>
      </div>
    </div>
  );
};
