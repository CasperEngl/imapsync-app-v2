import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";
import { cn } from "~/renderer/lib/utils.js";

export function Progress({ ref, className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      ref={ref}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all",
          value
            ? [
                value > 0 && value < 100 ? "animate-pulse" : null,
                value > 0 ? "bg-primary" : "bg-muted",
              ]
            : null,
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
