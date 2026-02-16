import * as React from "react";
import { Pressable, View, type ViewProps } from "react-native";
import { cn } from "../lib/utils";

interface SwitchProps extends Omit<ViewProps, "children"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = React.forwardRef<React.ElementRef<typeof Pressable>, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const handlePress = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={disabled}
        className={cn(
          "h-8 w-14 rounded-full border-2 border-border p-1",
          checked ? "bg-primary" : "bg-input",
          disabled && "opacity-50",
          className
        )}
        {...props}
      >
        <View
          className={cn(
            "h-5 w-5 rounded-full bg-background transition-all",
            checked && "translate-x-6"
          )}
        />
      </Pressable>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
