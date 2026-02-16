import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "../lib/utils";

interface InputProps extends TextInputProps {
  asChild?: boolean;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, placeholderClassName, ...props }, ref) => {
    return (
      <TextInput
        className={cn(
          "h-12 rounded-md border-2 border-input bg-background px-4 py-3 text-base text-foreground",
          className
        )}
        placeholderTextColor="var(--muted-foreground)"
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
