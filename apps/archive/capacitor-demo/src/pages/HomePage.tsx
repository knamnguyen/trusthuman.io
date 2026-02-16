import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@sassy/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@sassy/ui/card';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">EngageKit Demo</h1>
          <p className="text-lg text-gray-600">
            Capacitor + Clerk + Google OAuth
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              This demo showcases Clerk authentication with Google sign-in in a Capacitor mobile app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              When you sign in, the app will open Safari (not a webview) for OAuth, giving you a seamless one-tap experience if you're already logged into Google.
            </p>

            {isSignedIn ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
                size="lg"
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/signin')}
                className="w-full"
                size="lg"
              >
                Get Started
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>Built with Capacitor.js</p>
        </div>
      </div>
    </div>
  );
};
