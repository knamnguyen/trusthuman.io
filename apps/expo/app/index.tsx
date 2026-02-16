import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Text } from "@sassy/ui-mobile-react-native/text";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/sign-in" />;
}
