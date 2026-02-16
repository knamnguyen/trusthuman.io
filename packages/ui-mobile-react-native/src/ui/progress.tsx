import * as React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "../lib/utils";

interface ProgressProps extends ViewProps {
  value?: number;
  max?: number;
}

const Progress = React.forwardRef<React.ElementRef<typeof View>, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <View
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full border-2 border-border bg-secondary/20",
          className
        )}
        {...props}
      >
        <View
          className="h-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </View>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
