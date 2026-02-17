import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useClerk, useUser } from "@clerk/clerk-expo";

import { Button } from "@sassy/ui-mobile-react-native/button";
import { Card, CardContent } from "@sassy/ui-mobile-react-native/card";
import { Text } from "@sassy/ui-mobile-react-native/text";

export default function DashboardScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-1 p-6">
        <Card>
          <CardContent className="">
            <Text className="text-card-foreground mb-4 text-2xl font-bold">
              Dashboard
            </Text>

            <View className="flex gap-3">
              <View>
                <Text className="text-muted-foreground text-sm">
                  Signed in as:
                </Text>
                <Text className="text-foreground text-lg font-medium">
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>

              <View>
                <Text className="text-muted-foreground text-sm">Name:</Text>
                <Text className="text-foreground text-lg font-medium">
                  {user?.fullName || "N/A"}
                </Text>
              </View>

              <Button onPress={() => signOut()} variant="outline" className="">
                <Text>Sign Out</Text>
              </Button>
              <Button
                onPress={() => console.log("button")}
                variant="primary"
                className=""
              >
                <Text>Hello</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}
