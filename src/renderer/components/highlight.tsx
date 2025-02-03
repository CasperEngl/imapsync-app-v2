"use client";

import * as React from "react";

import { cn } from "~/renderer/lib/utils.js";

export interface HighlightRef {
  scrollIntoView: (
    args?: ScrollIntoViewOptions & {
      /**
       * Duration in milliseconds before the highlight is removed.
       * @default 2500
       */
      highlightDuration?: number;
    },
  ) => void;
}

interface HighlightProps {
  children: React.ReactNode;
  className?: string;
  scrollTo?: boolean;
  ref: React.Ref<HighlightRef>;
}

export function Highlight({
  children,
  className,
  scrollTo = false,
  ref,
}: HighlightProps) {
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      scrollIntoView: (args) => {
        const { highlightDuration: delay, ...rest } = args ?? {};

        if (!elementRef.current) return;

        elementRef.current.style.setProperty(
          "--delay",
          delay?.toString() ?? "2500",
        );

        setIsHighlighted(true);

        // Scroll into view if scrollTo is true
        if (scrollTo) {
          elementRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
            ...rest,
          });
        }

        setTimeout(() => {
          if (!elementRef.current) return;

          elementRef.current.style.removeProperty("--delay");

          setIsHighlighted(false);
        }, delay ?? 2500);
      },
    }),
    [scrollTo],
  );

  return (
    <div
      className={cn(
        "inline-block rounded-lg outline-4 outline-offset-[12px] transition-all duration-500 data-[highlighted=true]:outline-offset-8 data-[highlighted=false]:outline-transparent data-[highlighted=true]:outline-primary delay-(--delay,_1500)",
        className,
      )}
      data-highlighted={isHighlighted}
      ref={elementRef}
    >
      {children}
    </div>
  );
}
