import * as React from "react";
import { View as RNView, type ViewProps } from "react-native";
import { View as SlottableView } from "@rn-primitives/slot";
import { cn } from "../lib/utils";
import { TextClassContext } from "./text";

interface CardProps extends ViewProps {
  asChild?: boolean;
}

const Card = React.forwardRef<React.ElementRef<typeof RNView>, CardProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? SlottableView : RNView;
    return (
      <Component
        className={cn(
          "rounded-lg border-[1.5px] border-border bg-card p-6",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<React.ElementRef<typeof RNView>, CardProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? SlottableView : RNView;
    return (
      <Component
        className={cn("flex flex-col space-y-1.5", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<React.ElementRef<typeof RNView>, CardProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? SlottableView : RNView;
    const textClass = "text-2xl font-semibold leading-none tracking-tight text-card-foreground";
    return (
      <TextClassContext.Provider value={textClass}>
        <Component className={cn(textClass, className)} ref={ref} {...props} />
      </TextClassContext.Provider>
    );
  }
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  React.ElementRef<typeof RNView>,
  CardProps
>(({ className, asChild = false, ...props }, ref) => {
  const Component = asChild ? SlottableView : RNView;
  const textClass = "text-sm text-muted-foreground";
  return (
    <TextClassContext.Provider value={textClass}>
      <Component className={cn(textClass, className)} ref={ref} {...props} />
    </TextClassContext.Provider>
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<React.ElementRef<typeof RNView>, CardProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? SlottableView : RNView;
    return (
      <Component className={cn("pt-0", className)} ref={ref} {...props} />
    );
  }
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<React.ElementRef<typeof RNView>, CardProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? SlottableView : RNView;
    return (
      <Component
        className={cn("flex flex-row items-center pt-0", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
