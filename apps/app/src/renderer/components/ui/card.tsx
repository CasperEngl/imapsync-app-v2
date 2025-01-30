import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "~/renderer/lib/utils.js";

export function Card({ ref, className, asChild = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean } & { ref?: React.RefObject<HTMLDivElement | null> }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn("rounded border bg-card text-card-foreground", className)}
      ref={ref}
      {...props}
    />
  );
}

export function CardHeader({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      ref={ref}
      {...props}
    />
  );
}

export function CardTitle({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      className={cn("font-semibold leading-none tracking-tight", className)}
      ref={ref}
      {...props}
    />
  );
}

export function CardDescription({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      className={cn("text-sm text-muted-foreground", className)}
      ref={ref}
      {...props}
    />
  );
}

export function CardContent({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return <div className={cn("p-6 pt-0", className)} ref={ref} {...props} />;
}

export function CardFooter({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      ref={ref}
      {...props}
    />
  );
}
