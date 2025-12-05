import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@sassy/ui/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground rounded-md border-[1.5px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] active:translate-y-[3px] active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground rounded-md border-[1.5px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] active:translate-y-[3px] active:shadow-none",
        outline:
          "bg-background text-foreground rounded-md border-[1.5px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] active:translate-y-[3px] active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground rounded-md border-[1.5px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] active:translate-y-[3px] active:shadow-none",
        ghost:
          "bg-background text-foreground rounded-md border-[1.5px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] active:translate-y-[3px] active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-md px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
