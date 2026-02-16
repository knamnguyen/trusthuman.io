import * as React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "../lib/utils";

interface SkeletonProps extends ViewProps {
  asChild?: boolean;
}

const Skeleton = React.forwardRef<React.ElementRef<typeof View>, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        className={cn("animate-pulse rounded-md bg-muted", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
