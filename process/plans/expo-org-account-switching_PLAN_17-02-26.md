# Expo Organization & Account Switching Implementation Plan

**Created**: 2026-02-17
**Status**: PENDING APPROVAL
**Approach**: Single bottom sheet with Zustand account store, Clerk org switching, bottom tab navigation

---

## Overview

Implement organization switching, account switching, and bottom tab navigation for the Expo React Native app. Users will access org/account switching via a bottom sheet triggered from the Profile tab.

---

## Architecture Decisions

### State Management
- **Organization state**: Managed by Clerk's `useOrganizationList()` + `setActive({ organization })`
- **Account state**: Zustand store (matching Next.js pattern) with `accountId` and `accountSlug`
- **No persistence**: Account selection is session-based (cleared on app restart)

### Navigation Structure
```
(app)/
├── _layout.tsx          # Tabs layout (convert from Stack)
├── (tabs)/
│   ├── index.tsx        # Home tab (current dashboard content)
│   └── profile.tsx      # Profile tab (triggers org/account switcher)
```

### Component Architecture
- **Reusable UI primitive**: `BottomSheet` component in `packages/ui-mobile-react-native/` — themed wrapper around `@gorhom/bottom-sheet` matching neobrutalist design
- **App-specific**: `OrgAccountSwitcher` in `apps/expo/src/components/` — contains business logic (Clerk hooks, tRPC queries, Zustand store)
- This follows the existing pattern: UI primitives in the shared package, app logic in the app

### Bottom Sheet UI Pattern
- Single bottom sheet with two sections:
  1. **Organizations section** (top) - List of user's orgs with active indicator
  2. **Accounts section** (bottom) - Accounts for selected org with active indicator
- Triggered from Profile tab
- Uses reusable `BottomSheet` from `@sassy/ui-mobile-react-native/bottom-sheet`

### tRPC Header Flow
1. User selects org → Clerk `setActive()` updates session → tRPC gets `orgId` from Clerk
2. User selects account → Zustand store updates → tRPC headers read `accountId` from store
3. tRPC sends `Authorization` (Clerk token) + `x-account-id` (from Zustand) + `x-trpc-source`

---

## Implementation Checklist

### 1. Install Dependencies
**File**: `apps/expo/package.json`

- [ ] Install `zustand` in `apps/expo` (state management)
- [ ] Install `@gorhom/bottom-sheet` in `packages/ui-mobile-react-native` (UI package owns the dependency)
- [ ] Verify `react-native-reanimated` and `react-native-gesture-handler` exist in `apps/expo` (required peer deps for bottom-sheet)

**Commands**:
```bash
cd apps/expo && pnpm add zustand
cd packages/ui-mobile-react-native && pnpm add @gorhom/bottom-sheet
# Only if missing in apps/expo: pnpm add react-native-gesture-handler react-native-reanimated
```

---

### 2. Create Reusable BottomSheet Component in UI Package
**New file**: `packages/ui-mobile-react-native/src/ui/bottom-sheet.tsx`

**Purpose**: Themed wrapper around `@gorhom/bottom-sheet` that matches the neobrutalist design system. Reusable across any screen that needs a bottom sheet.

**Implementation**:
```typescript
import { forwardRef, useCallback, useMemo } from "react";
import { View } from "react-native";
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetProps as GorhomBottomSheetProps,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { cn } from "../lib/utils";

interface BottomSheetProps extends Partial<GorhomBottomSheetProps> {
  children: React.ReactNode;
  snapPoints?: string[];
}

const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  ({ children, snapPoints: snapPointsProp, ...props }, ref) => {
    const snapPoints = useMemo(() => snapPointsProp ?? ["75%"], [snapPointsProp]);

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      ),
      [],
    );

    return (
      <GorhomBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#000000", width: 40 }}
        backgroundStyle={{
          backgroundColor: "#f6f5ee",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderWidth: 2,
          borderColor: "#000000",
        }}
        {...props}
      >
        {children}
      </GorhomBottomSheet>
    );
  },
);
BottomSheet.displayName = "BottomSheet";

export { BottomSheet, BottomSheetScrollView };
export type { BottomSheetProps };
```

**Also update**:
- `packages/ui-mobile-react-native/package.json` — add export `"./bottom-sheet"` pointing to this file
- `packages/ui-mobile-react-native/package.json` — add `@gorhom/bottom-sheet` as a dependency

**Acceptance criteria**:
- Exports `BottomSheet` and `BottomSheetScrollView`
- Neobrutalist styling: black border, black drag handle, beige background
- Default snap point at 75%, starts closed (`index={-1}`)
- Pan down to close + backdrop tap to close
- Importable as `@sassy/ui-mobile-react-native/bottom-sheet`

---

### 3. Create Zustand Account Store
**New file**: `apps/expo/src/stores/account-store.ts`

**Implementation**:
```typescript
import { create } from "zustand";

interface AccountState {
  accountId: string | null;
  accountSlug: string | null;
}

interface AccountActions {
  setAccount: (accountId: string | null, accountSlug: string | null) => void;
  clearAccount: () => void;
}

type AccountStore = AccountState & AccountActions;

export const useAccountStore = create<AccountStore>((set) => ({
  accountId: null,
  accountSlug: null,

  setAccount: (accountId, accountSlug) => {
    set({ accountId, accountSlug });
  },

  clearAccount: () => {
    set({ accountId: null, accountSlug: null });
  },
}));
```

**Why no persistence**: Unlike Next.js (cookies), React Native requires AsyncStorage. For MVP, session-based state is simpler. Users re-select on app restart.

**Acceptance criteria**:
- Export `useAccountStore` hook
- Store has `accountId`, `accountSlug`, `setAccount()`, `clearAccount()`
- Initial state has null values

---

### 4. Update tRPC Provider to Send x-account-id Header
**File**: `apps/expo/src/utils/trpc-provider.tsx`

**Changes**:
```typescript
// Add import at top
import { useAccountStore } from "../stores/account-store";

// In TRPCReactProvider, update headers function:
async headers() {
  const headers: Record<string, string> = {
    "x-trpc-source": "expo-react-native",
  };

  const token = await getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add x-account-id from Zustand store
  const accountId = useAccountStore.getState().accountId;
  if (accountId) {
    headers["x-account-id"] = accountId;
  }

  return headers;
}
```

**Acceptance criteria**:
- tRPC sends `x-account-id` header when accountId exists in store
- Header is omitted when accountId is null (org-level pages)
- No breaking changes to existing auth headers

---

### 5. Convert (app) Layout from Stack to Tabs
**File**: `apps/expo/app/(app)/_layout.tsx`

**Changes**:
```typescript
import { Text, View } from "react-native";
import { Redirect, Tabs } from "expo-router"; // Change Stack to Tabs
import { useAuth } from "@clerk/clerk-expo";

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 2,
          borderTopColor: "#000000",
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#888888",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
```

**Acceptance criteria**:
- Bottom tab bar visible at bottom of screen
- Two tabs: Home (index), Profile
- Neobrutalist styling (black borders, white background)
- Icon emojis as placeholders (can be replaced with proper icons later)

---

### 6. Rename dashboard.tsx to index.tsx
**Files**:
- Rename `apps/expo/app/(app)/dashboard.tsx` → `apps/expo/app/(app)/index.tsx`

**No code changes needed** - just file rename to match tab routing convention.

**Acceptance criteria**:
- Home tab displays existing dashboard content
- No functional changes to dashboard code

---

### 7. Create Profile Screen with Bottom Sheet Trigger
**New file**: `apps/expo/app/(app)/profile.tsx`

**Implementation**:
```typescript
import { useRef } from "react";
import { View } from "react-native";
import { useClerk, useUser } from "@clerk/clerk-expo";
import BottomSheet from "@gorhom/bottom-sheet";

import { Button } from "@sassy/ui-mobile-react-native/button";
import { Card, CardContent } from "@sassy/ui-mobile-react-native/card";
import { Text } from "@sassy/ui-mobile-react-native/text";

import { OrgAccountSwitcher } from "../../src/components/org-account-switcher";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <View className="bg-background flex-1 p-6">
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

            <Button
              onPress={() => bottomSheetRef.current?.expand()}
              variant="outline"
            >
              <Text>Switch Organization / Account</Text>
            </Button>

            <Button onPress={() => signOut()} variant="outline">
              <Text>Sign Out</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      <OrgAccountSwitcher ref={bottomSheetRef} />
    </View>
  );
}
```

**Acceptance criteria**:
- Profile displays user email and name
- "Switch Organization / Account" button opens bottom sheet
- Sign out button works
- Bottom sheet component renders (next step)

---

### 8. Create Organization & Account Switcher Bottom Sheet Component
**New file**: `apps/expo/src/components/org-account-switcher.tsx`

**Note**: This is an app-specific component (not in the UI package) because it contains business logic — Clerk hooks, tRPC queries, and Zustand store access.

**Implementation**:
```typescript
import { forwardRef } from "react";
import { View, TouchableOpacity } from "react-native";
import type GorhomBottomSheet from "@gorhom/bottom-sheet";
import { useOrganization, useOrganizationList } from "@clerk/clerk-expo";

import { BottomSheet, BottomSheetScrollView } from "@sassy/ui-mobile-react-native/bottom-sheet";

import { Badge } from "@sassy/ui-mobile-react-native/badge";
import { Card, CardContent } from "@sassy/ui-mobile-react-native/card";
import { Separator } from "@sassy/ui-mobile-react-native/separator";
import { Text } from "@sassy/ui-mobile-react-native/text";

import { api } from "../utils/trpc";
import { useAccountStore } from "../stores/account-store";

export const OrgAccountSwitcher = forwardRef<GorhomBottomSheet>((props, ref) => {
  const { organization: activeOrg, isLoaded: isOrgLoaded } = useOrganization();
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const { accountId, setAccount, clearAccount } = useAccountStore();

  // Fetch accounts for active org (only when org is selected)
  const { data: accounts, isLoading: isAccountsLoading } =
    api.account.listByOrg.useQuery(undefined, {
      enabled: !!activeOrg?.id,
    });

  const handleOrgSwitch = async (orgId: string) => {
    await setActive?.({ organization: orgId });
    clearAccount(); // Clear account selection when switching orgs
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
          ) : (
            userMemberships?.data?.map((membership) => (
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
            <Text className="text-muted-foreground">Loading accounts...</Text>
          ) : accounts?.length === 0 ? (
            <Text className="text-muted-foreground">
              No accounts in this organization
            </Text>
          ) : (
            accounts?.map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => handleAccountSwitch(account.id, account.profileSlug)}
              >
                <Card className="mb-2">
                  <CardContent className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-foreground font-medium">
                        {account.profileUrl}
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
});

OrgAccountSwitcher.displayName = "OrgAccountSwitcher";
```

**Acceptance criteria**:
- Bottom sheet shows organizations at top with active badge
- Switching org calls `setActive()` and clears account selection
- Bottom sheet shows accounts below (filtered by active org)
- Switching account updates Zustand store
- Empty states for "no org selected" and "no accounts"
- Loading states while fetching data

---

### 9. Update Root Layout for GestureHandler (if needed)
**File**: `apps/expo/app/_layout.tsx`

**Only if gesture-handler was newly installed**:
```typescript
import "../global.css";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Add this

import { TRPCReactProvider } from "../src/utils/trpc-provider";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <TRPCReactProvider>
          <Slot />
        </TRPCReactProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
```

**Acceptance criteria**:
- Only wrap if gesture-handler is not already initialized
- Bottom sheet gestures work (pan to close, backdrop tap to close)

---

### 10. Update Entry Redirect for Tab Navigation
**File**: `apps/expo/app/index.tsx`

**Changes**:
```typescript
// Change redirect from "/dashboard" to "/" (tabs index)
if (isSignedIn) {
  return <Redirect href="/" />; // Changed from "/dashboard"
}
```

**Acceptance criteria**:
- After sign-in, user lands on Home tab
- Auth routing still works (redirects to sign-in if not authenticated)

---

## Testing Plan

### Manual Testing Checklist

**Tab Navigation**:
- [ ] Bottom tab bar is visible at bottom of screen
- [ ] Home tab shows dashboard content
- [ ] Profile tab shows profile screen
- [ ] Tab switching works smoothly
- [ ] Neobrutalist styling matches design system

**Organization Switching**:
- [ ] Profile screen "Switch Organization / Account" button opens bottom sheet
- [ ] Organizations list shows all user's orgs
- [ ] Active org has "Active" badge
- [ ] Tapping org switches Clerk active org
- [ ] Switching org clears account selection
- [ ] Bottom sheet closes on backdrop tap and pan down

**Account Switching**:
- [ ] Accounts section is empty when no org is selected
- [ ] Accounts section shows accounts for active org
- [ ] Active account has "Active" badge
- [ ] Tapping account updates Zustand store
- [ ] Store persists across tab switches (session-based)

**tRPC Integration**:
- [ ] `x-account-id` header is sent when account is selected
- [ ] Header is omitted when account is null
- [ ] `account.listByOrg` query works (requires active org)
- [ ] orgProcedure endpoints work with Clerk org switching

**Edge Cases**:
- [ ] Empty state for user with no orgs
- [ ] Empty state for org with no accounts
- [ ] Loading states show while fetching data
- [ ] Sign out clears all state

---

## Rollback Plan

If issues arise:

1. **Revert tab navigation**: Change `(app)/_layout.tsx` back to Stack
2. **Revert entry redirect**: Change `index.tsx` redirect back to `/dashboard`
3. **Rename file**: `index.tsx` → `dashboard.tsx`
4. **Remove bottom sheet**: Delete `profile.tsx` and `org-account-switcher.tsx`
5. **Remove header changes**: Remove `x-account-id` header from `trpc-provider.tsx`
6. **Uninstall dependencies**: `pnpm remove zustand @gorhom/bottom-sheet`

---

## Future Enhancements (Out of Scope)

- **AsyncStorage persistence**: Remember account selection across app restarts
- **Proper tab icons**: Replace emoji placeholders with icon library (e.g., `@expo/vector-icons`)
- **Organization creation**: Add "Create Organization" button in bottom sheet
- **Account creation**: Add "Add Account" button in accounts section
- **Pull to refresh**: Refresh accounts list in bottom sheet
- **Optimistic updates**: Update UI immediately before tRPC mutation completes

---

## Dependencies

**New packages**:
- `zustand` in `apps/expo` - State management for account selection
- `@gorhom/bottom-sheet` in `packages/ui-mobile-react-native` - Native bottom sheet (owned by UI package)

**Existing packages (verify present in `apps/expo`)**:
- `react-native-reanimated` - Required peer dep for bottom-sheet
- `react-native-gesture-handler` - Required peer dep for bottom-sheet

---

## File Summary

**New files**:
- `packages/ui-mobile-react-native/src/ui/bottom-sheet.tsx` (reusable UI primitive)
- `apps/expo/src/stores/account-store.ts`
- `apps/expo/app/(app)/profile.tsx`
- `apps/expo/src/components/org-account-switcher.tsx` (app-specific, business logic)

**Modified files**:
- `packages/ui-mobile-react-native/package.json` (add bottom-sheet export + peer dep)
- `apps/expo/package.json` (add zustand)
- `apps/expo/app/_layout.tsx` (GestureHandlerRootView wrapper)
- `apps/expo/app/(app)/_layout.tsx` (Stack → Tabs)
- `apps/expo/app/(app)/dashboard.tsx` → `apps/expo/app/(app)/index.tsx` (rename)
- `apps/expo/app/index.tsx` (redirect update)
- `apps/expo/src/utils/trpc-provider.tsx` (x-account-id header)

**Total**: 4 new files, 7 modified files

---

## Acceptance Criteria (Summary)

- [ ] Bottom tab navigation with Home and Profile tabs
- [ ] Organization switcher in bottom sheet (Clerk-based)
- [ ] Account switcher in bottom sheet (Zustand-based)
- [ ] tRPC sends `x-account-id` header from Zustand store
- [ ] Neobrutalist design matches existing UI components
- [ ] All empty states and loading states handled
- [ ] No breaking changes to existing auth flow

---

**END OF PLAN**
