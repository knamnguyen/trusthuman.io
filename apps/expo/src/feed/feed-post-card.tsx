import { useState } from "react";
import { TextInput, View } from "react-native";
import { Check, Eye, RefreshCw, Sparkles, Trash2 } from "lucide-react-native";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sassy/ui-mobile-react-native/avatar";
import { Badge } from "@sassy/ui-mobile-react-native/badge";
import { Button } from "@sassy/ui-mobile-react-native/button";
import { Card, CardContent } from "@sassy/ui-mobile-react-native/card";
import { Text } from "@sassy/ui-mobile-react-native/text";

import type { FeedItem } from "./types";
import { formatTimeAgo, getInitials, getTouchScoreColor } from "./utils";

interface FeedPostCardProps {
  item: FeedItem;
  onOpenPreview: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateComment: (id: string, newComment: string) => void;
}

/**
 * Feed card for the scrollable list. Shows author, editable AI comment,
 * touch score, and quick-action buttons. Eye button opens the full post
 * preview in a bottom sheet.
 *
 * Mirrors the nextjs FeedPostCard but adapted for mobile:
 * - Comment is directly editable inline (syncs on blur)
 * - Eye button opens the bottom sheet for full post view
 */
export function FeedPostCard({
  item,
  onOpenPreview,
  onApprove,
  onReject,
  onUpdateComment,
}: FeedPostCardProps) {
  const isPending = item.status === "pending";
  const [localComment, setLocalComment] = useState(item.aiComment);

  const getCaptionPreview = (caption: string, maxLen = 50): string => {
    if (caption.length <= maxLen) return caption;
    return caption.slice(0, maxLen) + "...";
  };

  return (
    <Card className="mb-3">
      <CardContent className="gap-2">
        {/* Row 1: Avatar + Author + Caption preview + Status badge */}
        <View className="flex-row items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              source={{ uri: item.post.authorAvatarUrl }}
              alt={item.post.authorName}
            />
            <AvatarFallback>
              <Text className="text-xs">
                {getInitials(item.post.authorName)}
              </Text>
            </AvatarFallback>
          </Avatar>

          <View className="min-w-0 flex-1">
            <Text
              className="text-foreground text-sm font-medium"
              numberOfLines={1}
            >
              {item.post.authorName}
            </Text>
            <Text className="text-muted-foreground text-xs" numberOfLines={1}>
              {getCaptionPreview(item.post.postFullCaption)}
            </Text>
          </View>

          <Badge
            variant={item.status === "approved" ? "default" : "outline"}
            className={
              item.status === "approved"
                ? "bg-green-600"
                : item.status === "rejected"
                  ? "bg-red-500"
                  : ""
            }
          >
            <Text className="text-[10px] capitalize">{item.status}</Text>
          </Badge>
        </View>

        {/* Row 2: Editable AI comment */}
        <TextInput
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
            textAlignVertical: "top",
            fontSize: 14,
            lineHeight: 20,
            color: "#000",
            borderWidth: 1.5,
            borderColor: "#000",
            borderRadius: 6,
            padding: 10,
            backgroundColor: "#fff",
          }}
          numberOfLines={3}
        />

        {/* Row 3: Touch score + time + Actions */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Sparkles
                size={12}
                color={
                  item.touchScore >= 70
                    ? "#16a34a"
                    : item.touchScore >= 30
                      ? "#ca8a04"
                      : "#ef4444"
                }
              />
              <Text
                className={`text-xs font-medium ${getTouchScoreColor(item.touchScore)}`}
              >
                {item.touchScore}%
              </Text>
            </View>
            <Text className="text-muted-foreground text-xs">
              {formatTimeAgo(item.post.postCreatedAt)}
            </Text>
          </View>

          {/* Action buttons — order: trash, regen, eye, approve */}
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

            {/* Eye button — opens full post in bottom sheet */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onPress={onOpenPreview}
            >
              <Eye size={14} color="#71717a" />
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
      </CardContent>
    </Card>
  );
}
