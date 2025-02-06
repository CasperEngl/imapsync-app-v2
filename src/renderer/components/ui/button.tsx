import type { VariantProps } from "class-variance-authority";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { buttonVariants } from "~/renderer/components/ui/button.styles.js";
import { cn } from "~/renderer/lib/utils.js";

export interface ButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  ref,
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
}
