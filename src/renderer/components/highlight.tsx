"use client"

import * as React from "react"
import { cn } from "../lib/utils.js"

interface HighlightProps {
  children: React.ReactNode
  className?: string
  active: boolean
  scrollTo?: boolean
}

export function Highlight({
  children,
  className,
  active,
  scrollTo = false,
}: HighlightProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isHighlighted, setIsHighlighted] = React.useState(active)

  React.useEffect(() => {
    if (!active) {
      setIsHighlighted(false)

      return
    }

    setIsHighlighted(true)

    // Scroll into view if scrollTo is true
    if (scrollTo && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    const timer = setTimeout(() => {
      setIsHighlighted(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [active, scrollTo])

  return (
    <div
      className={cn(
        "inline-block rounded-lg outline-4 outline-offset-[12px] transition-all delay-1000 duration-500 data-[highlighted=true]:outline-offset-8 data-[highlighted=false]:outline-transparent data-[highlighted=true]:outline-primary",
        className,
      )}
      data-highlighted={isHighlighted}
      ref={ref}
    >
      {children}
    </div>
  )
}
