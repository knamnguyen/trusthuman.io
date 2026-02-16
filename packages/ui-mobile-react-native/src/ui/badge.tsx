import * as React from "react";
import { View as RNView, type ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { View as SlottableView } from "@rn-primitives/slot";
import { cn } from "../lib/utils";
import { TextClassContext } from "./text";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-border px-2.5 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        destructive: "bg-destructive",
        outline: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const badgeTextVariants = cva("text-xs font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

const Badge = React.forwardRef<React.ElementRef<typeof RNView>, BadgeProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Component = asChild ? SlottableView : RNView;
    const textClass = badgeTextVariants({ variant });
    return (
      <TextClassContext.Provider value={textClass}>
        <Component
          className={cn(badgeVariants({ variant }), className)}
          ref={ref}
          {...props}
        />
      </TextClassContext.Provider>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants, badgeTextVariants };
