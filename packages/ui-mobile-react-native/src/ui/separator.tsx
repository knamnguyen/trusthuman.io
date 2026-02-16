import * as React from "react";
import { View as RNView, type ViewProps } from "react-native";
import { View as SlottableView } from "@rn-primitives/slot";
import { cn } from "../lib/utils";

interface SeparatorProps extends ViewProps {
  orientation?: "horizontal" | "vertical";
  asChild?: boolean;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof RNView>,
  SeparatorProps
>(
  (
    { className, orientation = "horizontal", asChild = false, ...props },
    ref
  ) => {
    const Component = asChild ? SlottableView : RNView;
    return (
      <Component
        className={cn(
          "bg-border",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Separator.displayName = "Separator";

export { Separator };
