import * as React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { Text as SlottableText } from "@rn-primitives/slot";
import { cn } from "../lib/utils";

// TextClassContext for parent-to-child style propagation
const TextClassContext = React.createContext<string | undefined>(undefined);

interface TextProps extends RNTextProps {
  asChild?: boolean;
}

const Text = React.forwardRef<RNText, TextProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext);
    const Component = asChild ? SlottableText : RNText;
    return (
      <Component
        className={cn("text-base text-foreground", textClass, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Text, TextClassContext };
