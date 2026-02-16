import React, { useCallback, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Text } from "@sassy/ui-mobile-react-native/text";
import { Button } from "@sassy/ui-mobile-react-native/button";

// MUST be called at module level
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  // Warm up browser on Android
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/dashboard", { scheme: "engagekit" }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // Force navigation after auth completes
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("OAuth error:", JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="w-full max-w-sm space-y-8">
        <View className="items-center">
          <Text className="text-3xl font-bold">Welcome</Text>
          <Text className="mt-2 text-muted-foreground">
            Sign in to continue
          </Text>
        </View>

        <Button
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text>Sign in with Google</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
