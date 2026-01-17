import NumberFlow from "@number-flow/react";
import * as RadixSlider from "@radix-ui/react-slider";

import { cn } from "@sassy/ui/utils";

export default function Slider({
  value,
  className,
  ...props
}: RadixSlider.SliderProps) {
  return (
    <RadixSlider.Root
      {...props}
      value={value}
      className={cn(
        className,
        "relative flex h-5 w-full touch-none select-none items-center"
      )}
    >
      <RadixSlider.Track className="relative h-[3px] grow rounded-full bg-zinc-100 dark:bg-zinc-800">
        <RadixSlider.Range className="absolute h-full rounded-full bg-black dark:bg-white" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="relative block h-5 w-5 rounded-[1rem] bg-white shadow-md ring ring-black/10 focus:outline-none"
        aria-label={props["aria-label"] ?? "Slider"}
      >
        {value?.[0] != null && (
          <NumberFlow
            willChange
            isolate
            value={value[0]}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-lg font-semibold"
          />
        )}
      </RadixSlider.Thumb>
    </RadixSlider.Root>
  );
}

export { Slider };
