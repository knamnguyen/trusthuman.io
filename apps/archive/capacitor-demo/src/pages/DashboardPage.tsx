import React from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Button } from '@sassy/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@sassy/ui/card';

export const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('[Dashboard] Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-lg text-gray-900">
                {user?.primaryEmailAddress?.emailAddress || 'Not available'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Name</p>
              <p className="text-lg text-gray-900">
                {user?.fullName || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">User ID</p>
              <p className="text-sm font-mono text-gray-700 break-all">
                {user?.id}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              You've successfully authenticated using Google OAuth in a Capacitor mobile app with Clerk!
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900">Authentication Flow Complete</p>
              <ul className="mt-2 space-y-1 text-sm text-green-800">
                <li>✓ OAuth opened in Safari (not webview)</li>
                <li>✓ Google sign-in completed</li>
                <li>✓ Deep link callback received</li>
                <li>✓ Clerk session established</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
