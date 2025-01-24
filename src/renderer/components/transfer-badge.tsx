import type { VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Badge, badgeVariants } from "~/renderer/components/ui/badge.js";
import { cn } from "~/renderer/lib/utils.js";
import type { TransferStatus } from "~/renderer/store.js";

interface TransferBadgeProps {
  status: TransferStatus;
  className?: string;
}

const statusConfig = {
  idle: {
    text: "Idle",
    variant: "outline",
    icon: <Circle className="size-4" />,
  },
  syncing: {
    text: "Syncing",
    variant: "info",
    icon: <Loader2 className="animate-spin size-4" />,
  },
  completed: {
    text: "Completed",
    variant: "success",
    icon: <CheckCircle2 className="size-4" />,
  },
  error: {
    text: "Error",
    variant: "destructive",
    icon: <AlertCircle className="size-4" />,
  },
} as const satisfies Record<
  TransferStatus,
  {
    text: string;
    variant: VariantProps<typeof badgeVariants>["variant"];
    icon: JSX.Element;
  }
>;

export function TransferBadge({ status, className }: TransferBadgeProps) {
  const config = statusConfig[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn("space-x-2", className)}
      size="lg"
    >
      {Icon}
      <span>{config.text}</span>
    </Badge>
  );
}
