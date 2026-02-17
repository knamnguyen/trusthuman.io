import { useRef } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useClerk, useUser, useOrganization } from "@clerk/clerk-expo";
import type GorhomBottomSheet from "@gorhom/bottom-sheet";

import { Button } from "@sassy/ui-mobile-react-native/button";
import { Card, CardContent } from "@sassy/ui-mobile-react-native/card";
import { Text } from "@sassy/ui-mobile-react-native/text";

import { OrgAccountSwitcher } from "../../src/components/org-account-switcher";
import { useAccountStore } from "../../src/stores/account-store";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const { accountSlug } = useAccountStore();
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);

  return (
    <SafeAreaView className="bg-background flex-1">
    <View className="flex-1 p-6">
      <Card>
        <CardContent>
          <Text className="text-card-foreground mb-4 text-2xl font-bold">
            Profile
          </Text>

          <View className="flex gap-3">
            <View>
              <Text className="text-muted-foreground text-sm">Email:</Text>
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

            <View>
              <Text className="text-muted-foreground text-sm">
                Organization:
              </Text>
              <Text className="text-foreground text-lg font-medium">
                {organization?.name ?? "None selected"}
              </Text>
            </View>

            <View>
              <Text className="text-muted-foreground text-sm">Account:</Text>
              <Text className="text-foreground text-lg font-medium">
                {accountSlug ?? "None selected"}
              </Text>
            </View>

            <Button
              onPress={() => bottomSheetRef.current?.expand()}
              variant="outline"
            >
              <Text>Switch Organization / Account</Text>
            </Button>

            <Button onPress={() => signOut()} variant="destructive">
              <Text>Sign Out</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      <OrgAccountSwitcher ref={bottomSheetRef} />
    </View>
    </SafeAreaView>
  );
}
