import { forwardRef, useEffect, useState } from "react";
import { View } from "react-native";
import GorhomBottomSheet, {
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react-native";

import {
  BottomSheet,
  BottomSheetScrollView,
} from "@sassy/ui-mobile-react-native/bottom-sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sassy/ui-mobile-react-native/avatar";
import { Button } from "@sassy/ui-mobile-react-native/button";
import { Separator } from "@sassy/ui-mobile-react-native/separator";
import { Text } from "@sassy/ui-mobile-react-native/text";

import type { FeedItem } from "./types";
import { formatTimeAgo, getInitials, getTouchScoreColor } from "./utils";

interface PostPreviewSheetProps {
  item: FeedItem | null;
  currentIndex: number;
  totalCount: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateComment: (id: string, newComment: string) => void;
}

/**
 * Bottom sheet that shows the full LinkedIn post preview + editable comment.
 *
 * This is the mobile equivalent of the nextjs FeedCommentEditor (right panel).
 * On desktop it's a permanent side panel; on mobile it slides up as a bottom sheet
 * when the user taps the eye icon on a feed card.
 *
 * Layout:
 * - Top (scrollable): Author info + Full post caption
 * - Bottom (sticky): Editable comment + touch score + actions + prev/next nav
 */
export const PostPreviewSheet = forwardRef<
  GorhomBottomSheet,
  PostPreviewSheetProps
>(
  (
    {
      item,
      currentIndex,
      totalCount,
      canGoPrev,
      canGoNext,
      onPrev,
      onNext,
      onApprove,
      onReject,
      onUpdateComment,
    },
    ref,
  ) => {
    const [localComment, setLocalComment] = useState(item?.aiComment ?? "");

    // Sync local comment when selected item changes
    useEffect(() => {
      setLocalComment(item?.aiComment ?? "");
    }, [item?.id, item?.aiComment]);

    const isPending = item?.status === "pending";

    return (
      <BottomSheet ref={ref} snapPoints={["70%"]}>
        {item ? (
          <View className="flex-1">
            {/* Scrollable area: author info + post content */}
            <BottomSheetScrollView className="flex-1 px-4 pt-2">
              {/* Author info */}
              <View className="flex-row items-center gap-3 pb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    source={{ uri: item.post.authorAvatarUrl }}
                    alt={item.post.authorName}
                  />
                  <AvatarFallback>
                    <Text className="text-sm">
                      {getInitials(item.post.authorName)}
                    </Text>
                  </AvatarFallback>
                </Avatar>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-foreground text-base font-semibold">
                      {item.post.authorName}
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      {formatTimeAgo(item.post.postCreatedAt)}
                    </Text>
                  </View>
                  <Text
                    className="text-muted-foreground text-sm"
                    numberOfLines={2}
                  >
                    {item.post.authorHeadline}
                  </Text>
                </View>
              </View>

              <Separator className="mb-3" />

              {/* Full post caption */}
              <Text className="text-foreground mb-4 text-sm leading-6">
                {item.post.postFullCaption}
              </Text>
            </BottomSheetScrollView>

            {/* Sticky bottom: comment + actions + navigation */}
            <View className="border-border border-t px-4 pb-6 pt-3">
              {/* Editable comment */}
              <Text className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Your Comment
              </Text>
              <BottomSheetTextInput
                value={localComment}
                onChangeText={setLocalComment}
                onBlur={() => {
                  if (localComment !== item.aiComment) {
                    onUpdateComment(item.id, localComment);
                  }
                }}
                placeholder="Write your comment..."
                multiline
                editable={isPending}
                style={{
                  minHeight: 80,
                  textAlignVertical: "top",
                  borderWidth: 1.5,
                  borderColor: "#000",
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 14,
                  lineHeight: 20,
                  backgroundColor: "#fff",
                }}
              />

              {/* Touch score + Action buttons */}
              <View className="mt-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <Sparkles
                    size={14}
                    color={
                      item.touchScore >= 70
                        ? "#16a34a"
                        : item.touchScore >= 30
                          ? "#ca8a04"
                          : "#ef4444"
                    }
                  />
                  <Text
                    className={`text-sm font-medium ${getTouchScoreColor(item.touchScore)}`}
                  >
                    Your Touch: {item.touchScore}%
                  </Text>
                </View>

                {/* Action buttons — outline variant with neobrutalist shadow */}
                <View className="flex-row items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onPress={() => onReject(item.id)}
                    disabled={!isPending}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onPress={() => {
                      /* Mock: no-op for now */
                    }}
                    disabled={!isPending}
                  >
                    <RefreshCw size={14} color="#71717a" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-row"
                    onPress={() => onApprove(item.id)}
                    disabled={!isPending}
                  >
                    <Check size={14} color="#16a34a" />
                    <Text className="ml-1 text-xs font-semibold text-green-600">
                      Approve
                    </Text>
                  </Button>
                </View>
              </View>

              {/* Navigation: Prev / Next — outline variant with neobrutalist shadow */}
              <View className="mt-3 flex-row items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-row px-3"
                  onPress={onPrev}
                  disabled={!canGoPrev}
                >
                  <ChevronLeft size={16} color="#000" />
                  <Text className="ml-1 text-sm font-medium">Prev</Text>
                </Button>

                <Text className="text-muted-foreground min-w-[50px] text-center text-sm">
                  {currentIndex + 1} / {totalCount}
                </Text>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-row px-3"
                  onPress={onNext}
                  disabled={!canGoNext}
                >
                  <Text className="mr-1 text-sm font-medium">Next</Text>
                  <ChevronRight size={16} color="#000" />
                </Button>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">
              Select a post to review
            </Text>
          </View>
        )}
      </BottomSheet>
    );
  },
);

PostPreviewSheet.displayName = "PostPreviewSheet";
