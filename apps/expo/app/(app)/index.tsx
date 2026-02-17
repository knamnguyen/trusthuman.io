import { useCallback, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type GorhomBottomSheet from "@gorhom/bottom-sheet";
import { Rss } from "lucide-react-native";

import { Badge } from "@sassy/ui-mobile-react-native/badge";
import { Text } from "@sassy/ui-mobile-react-native/text";

import { FeedPostCard } from "../../src/feed/feed-post-card";
import { mockFeedItems } from "../../src/feed/mock-data";
import { PostPreviewSheet } from "../../src/feed/post-preview-sheet";
import type { FeedItem } from "../../src/feed/types";

/**
 * Feed screen — the default tab in the mobile app.
 *
 * Shows a scrollable list of AI-generated comment drafts on LinkedIn posts.
 * Users can approve, reject, or regenerate comments directly from the list.
 * Tapping a card opens a bottom sheet with the full post + editable comment.
 *
 * Uses mock data for now — will be wired to the same tRPC endpoints as the
 * nextjs feed page (apps/nextjs/.../feed/) once the backend is ready.
 */
export default function FeedScreen() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([...mockFeedItems]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const sheetRef = useRef<GorhomBottomSheet>(null);

  // Derived state
  const selectedItem =
    feedItems.find((i) => i.id === selectedItemId) ?? null;
  const selectedIndex = selectedItemId
    ? feedItems.findIndex((i) => i.id === selectedItemId)
    : -1;
  const canGoPrev = selectedIndex > 0;
  const canGoNext =
    selectedIndex >= 0 && selectedIndex < feedItems.length - 1;
  const pendingCount = feedItems.filter(
    (i) => i.status === "pending",
  ).length;

  /**
   * After approve/reject, find the next pending item (search forward then
   * wrap around). If none left, deselect and close the sheet.
   */
  const autoAdvance = useCallback(
    (currentIndex: number, updatedItems: FeedItem[]) => {
      // Search forward
      for (let i = currentIndex + 1; i < updatedItems.length; i++) {
        if (updatedItems[i]?.status === "pending") {
          setSelectedItemId(updatedItems[i]!.id);
          return;
        }
      }
      // Wrap around
      for (let i = 0; i < currentIndex; i++) {
        if (updatedItems[i]?.status === "pending") {
          setSelectedItemId(updatedItems[i]!.id);
          return;
        }
      }
      // No more pending — close sheet
      setSelectedItemId(null);
      sheetRef.current?.close();
    },
    [],
  );

  const handleApprove = useCallback(
    (id: string) => {
      const currentIdx = feedItems.findIndex((i) => i.id === id);
      const updated = feedItems.map((i) =>
        i.id === id ? { ...i, status: "approved" as const } : i,
      );
      setFeedItems(updated);
      autoAdvance(currentIdx, updated);
    },
    [feedItems, autoAdvance],
  );

  const handleReject = useCallback(
    (id: string) => {
      const currentIdx = feedItems.findIndex((i) => i.id === id);
      const updated = feedItems.map((i) =>
        i.id === id ? { ...i, status: "rejected" as const } : i,
      );
      setFeedItems(updated);
      autoAdvance(currentIdx, updated);
    },
    [feedItems, autoAdvance],
  );

  const handleUpdateComment = useCallback(
    (id: string, newComment: string) => {
      setFeedItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, aiComment: newComment } : i)),
      );
    },
    [],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedItemId(id);
      sheetRef.current?.expand();
    },
    [],
  );

  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedItemId(feedItems[selectedIndex - 1]!.id);
    }
  }, [selectedIndex, feedItems]);

  const handleNext = useCallback(() => {
    if (selectedIndex < feedItems.length - 1) {
      setSelectedItemId(feedItems[selectedIndex + 1]!.id);
    }
  }, [selectedIndex, feedItems]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <FeedPostCard
        item={item}
        onOpenPreview={() => handleSelect(item.id)}
        onApprove={handleApprove}
        onReject={handleReject}
        onUpdateComment={handleUpdateComment}
      />
    ),
    [handleSelect, handleApprove, handleReject, handleUpdateComment],
  );

  return (
    <SafeAreaView className="bg-background flex-1">
      {/* Header */}
      <View className="flex-row items-center gap-2 px-4 pb-3 pt-2">
        <Rss size={20} color="#000" />
        <Text className="text-foreground text-xl font-bold">Feed</Text>
        {pendingCount > 0 && (
          <Badge variant="outline">
            <Text className="text-xs">{pendingCount} pending</Text>
          </Badge>
        )}
      </View>

      {/* Feed list */}
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Post preview bottom sheet */}
      <PostPreviewSheet
        ref={sheetRef}
        item={selectedItem}
        currentIndex={selectedIndex}
        totalCount={feedItems.length}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={handlePrev}
        onNext={handleNext}
        onApprove={handleApprove}
        onReject={handleReject}
        onUpdateComment={handleUpdateComment}
      />
    </SafeAreaView>
  );
}
