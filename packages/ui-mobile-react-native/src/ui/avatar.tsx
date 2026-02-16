import * as React from "react";
import { Image as RNImage, View as RNView, type ImageProps, type ViewProps } from "react-native";
import { Image as SlottableImage, View as SlottableView } from "@rn-primitives/slot";
import { cn } from "../lib/utils";
import { TextClassContext } from "./text";

interface AvatarProps extends ViewProps {
  asChild?: boolean;
}

const Avatar = React.forwardRef<React.ElementRef<typeof RNView>, AvatarProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? SlottableView : RNView;
    return (
      <Component
        className={cn(
          "relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-border",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Avatar.displayName = "Avatar";

interface AvatarImageProps extends ImageProps {
  asChild?: boolean;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof RNImage>,
  AvatarImageProps
>(({ className, asChild = false, ...props }, ref) => {
  const Component = asChild ? SlottableImage : RNImage;
  return (
    <Component
      className={cn("aspect-square h-full w-full", className)}
      ref={ref}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof RNView>,
  AvatarProps
>(({ className, asChild = false, ...props }, ref) => {
  const Component = asChild ? SlottableView : RNView;
  const textClass = "text-sm font-medium text-foreground";
  return (
    <TextClassContext.Provider value={textClass}>
      <Component
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-muted",
          className
        )}
        ref={ref}
        {...props}
      />
    </TextClassContext.Provider>
  );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
