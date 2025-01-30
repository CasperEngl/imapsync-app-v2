import type { VariantProps } from "class-variance-authority";

import * as React from "react";
import { cn } from "~/renderer/lib/utils.js";

import { badgeVariants } from "./badge.styles.js";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, size, interactive, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, interactive }), className)} {...props} />
  );
}
