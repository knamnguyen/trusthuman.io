import type { VariantProps } from "class-variance-authority";
import type { PressableProps } from "react-native";
import * as React from "react";
import { View, Pressable as RNPressable } from "react-native";
import { Pressable as SlottablePressable } from "@rn-primitives/slot";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";
import { TextClassContext } from "./text";

const buttonVariants = cva(
  "border-border flex items-center justify-center rounded-md border-[1.5px]",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        destructive: "bg-destructive",
        outline: "bg-background",
        secondary: "bg-secondary",
        ghost: "border-transparent bg-transparent",
        link: "border-transparent bg-transparent",
      },
      size: {
        primary: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "primary",
    },
  },
);

const buttonTextVariants = cva("font-semibold", {
  variants: {
    variant: {
      primary: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary underline",
    },
    size: {
      primary: "text-base",
      sm: "text-sm",
      lg: "text-lg",
      icon: "text-base",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "primary",
  },
});

interface ButtonProps
  extends Omit<PressableProps, "children">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<
  React.ElementRef<typeof RNPressable>,
  ButtonProps
>(({ className, variant, size, asChild = false, disabled, children, ...props }, ref) => {
  const Component = asChild ? SlottablePressable : RNPressable;
  const textClass = buttonTextVariants({ variant, size });
  const [isPressed, setIsPressed] = React.useState(false);

  // Skip shadow for ghost/link variants (matching web)
  const hasNeobrutalistShadow = variant !== "ghost" && variant !== "link";
  // Smaller shadow for compact button sizes
  const shadowOffset = size === "sm" || size === "icon" ? 1 : 2;

  return (
    <TextClassContext.Provider value={textClass}>
      <View style={{ position: "relative", opacity: disabled ? 0.5 : 1 }}>
        {/* Neobrutalist shadow — scaled by button size */}
        {hasNeobrutalistShadow && (
          <View
            style={{
              position: "absolute",
              top: shadowOffset,
              left: shadowOffset,
              right: -shadowOffset,
              bottom: -shadowOffset,
              backgroundColor: "#000000",
              borderRadius: 6,
            }}
          />
        )}

        {/* Button with press animation */}
        <Component
          className={cn(
            buttonVariants({ variant, size }),
            className,
          )}
          style={{
            transform: [
              {
                translateX: hasNeobrutalistShadow && isPressed ? shadowOffset : 0,
              },
              {
                translateY: hasNeobrutalistShadow && isPressed ? shadowOffset : 0,
              },
            ],
          }}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          disabled={disabled}
          ref={ref}
          {...props}
        >
          {children}
        </Component>
      </View>
    </TextClassContext.Provider>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants, buttonTextVariants };
