"use client";

import * as React from "react";

import { cn } from "~/renderer/lib/utils.js";

export interface HighlightRef {
  highlight: (
    args?: ScrollIntoViewOptions & {
      /**
       * Duration in milliseconds before the highlight is removed.
       * @default 2500
       */
      highlightDuration?: number;
      /**
       * Scroll into view while highlighting.
       * @default false
       */
      scrollTo?: boolean;
    },
  ) => void;
}

interface HighlightProps {
  children: React.ReactNode;
  className?: string;
  ref: React.Ref<HighlightRef>;
}

export function Highlight({
  children,
  className,
  ref,
}: HighlightProps) {
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      highlight: (args) => {
        const { highlightDuration: delay = 2500, ...rest } = args ?? {};

        if (!elementRef.current) return;

        elementRef.current.style.setProperty(
          "--delay",
          delay.toString(),
        );

        setIsHighlighted(true);

        // Scroll into view if scrollTo is true
        if (args?.scrollTo) {
          setTimeout(() => {
            elementRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
              ...rest,
            });
          }, 100);
        }

        setTimeout(() => {
          if (!elementRef.current) return;

          elementRef.current.style.removeProperty("--delay");

          setIsHighlighted(false);
        }, delay);
      },
    }),
    [],
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
