import { forwardRef } from "react";
import { TouchableOpacity, View } from "react-native";
import type GorhomBottomSheet from "@gorhom/bottom-sheet";
import { useOrganization, useOrganizationList } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

import {
  BottomSheet,
  BottomSheetScrollView,
} from "@sassy/ui-mobile-react-native/bottom-sheet";
import { Badge } from "@sassy/ui-mobile-react-native/badge";
import { Card, CardContent } from "@sassy/ui-mobile-react-native/card";
import { Separator } from "@sassy/ui-mobile-react-native/separator";
import { Text } from "@sassy/ui-mobile-react-native/text";

import { useTRPC } from "../utils/trpc";
import { useAccountStore } from "../stores/account-store";

export const OrgAccountSwitcher = forwardRef<GorhomBottomSheet>(
  (_props, ref) => {
    const { organization: activeOrg, isLoaded: isOrgLoaded } =
      useOrganization();
    const { setActive, userMemberships } = useOrganizationList({
      userMemberships: { infinite: true },
    });

    const { accountId, setAccount, clearAccount } = useAccountStore();
    const trpc = useTRPC();

    const { data: accounts, isLoading: isAccountsLoading } = useQuery({
      ...trpc.account.listByOrg.queryOptions(),
      enabled: !!activeOrg?.id,
    });

    const handleOrgSwitch = async (orgId: string) => {
      await setActive?.({ organization: orgId });
      clearAccount();
    };

    const handleAccountSwitch = (accId: string, accSlug: string) => {
      setAccount(accId, accSlug);
    };

    return (
      <BottomSheet ref={ref}>
        <BottomSheetScrollView className="flex-1 px-4">
          {/* Organizations Section */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-bold">Organizations</Text>

            {!isOrgLoaded ? (
              <Text className="text-muted-foreground">Loading...</Text>
            ) : !userMemberships?.data?.length ? (
              <Text className="text-muted-foreground">
                No organizations found
              </Text>
            ) : (
              userMemberships.data.map((membership) => (
                <TouchableOpacity
                  key={membership.organization.id}
                  onPress={() => handleOrgSwitch(membership.organization.id)}
                >
                  <Card className="mb-2">
                    <CardContent className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-foreground font-medium">
                          {membership.organization.name}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                          {membership.role}
                        </Text>
                      </View>
                      {activeOrg?.id === membership.organization.id && (
                        <Badge variant="default">
                          <Text className="text-xs">Active</Text>
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>

          <Separator className="my-4" />

          {/* Accounts Section */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-bold">Accounts</Text>

            {!activeOrg ? (
              <Text className="text-muted-foreground">
                Select an organization first
              </Text>
            ) : isAccountsLoading ? (
              <Text className="text-muted-foreground">
                Loading accounts...
              </Text>
            ) : !accounts?.length ? (
              <Text className="text-muted-foreground">
                No accounts in this organization
              </Text>
            ) : (
              accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  onPress={() =>
                    handleAccountSwitch(account.id, account.profileSlug ?? "")
                  }
                >
                  <Card className="mb-2">
                    <CardContent className="flex-row items-center justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-foreground font-medium">
                          {account.profileSlug ?? account.profileUrl}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                          {account.status}
                        </Text>
                      </View>
                      {accountId === account.id && (
                        <Badge variant="default">
                          <Text className="text-xs">Active</Text>
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

OrgAccountSwitcher.displayName = "OrgAccountSwitcher";
