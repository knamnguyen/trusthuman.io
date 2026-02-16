import * as React from "react";
import { View as RNView, type ViewProps } from "react-native";
import { View as SlottableView } from "@rn-primitives/slot";
import { cn } from "../lib/utils";
import { TextClassContext } from "./text";

interface LabelProps extends ViewProps {
  asChild?: boolean;
}

const Label = React.forwardRef<React.ElementRef<typeof RNView>, LabelProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? SlottableView : RNView;
    const textClass = "text-sm font-medium leading-none text-foreground";
    return (
      <TextClassContext.Provider value={textClass}>
        <Component className={cn(textClass, className)} ref={ref} {...props} />
      </TextClassContext.Provider>
    );
  }
);
Label.displayName = "Label";

export { Label };
