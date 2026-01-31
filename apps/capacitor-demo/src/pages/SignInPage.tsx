import React from 'react';
import { SignInButton } from '../components/SignInButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@sassy/ui/card';

export const SignInPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="mt-2 text-gray-600">
            Continue with your Google account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Click below to sign in with Google via Safari
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton />

            <div className="mt-6 space-y-2 text-xs text-gray-600">
              <p className="font-medium">What happens next:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Safari will open for Google sign-in</li>
                <li>Sign in or one-tap if already logged in</li>
                <li>You'll be redirected back to this app</li>
                <li>Your session will be created automatically</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
