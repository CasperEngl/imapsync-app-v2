import type { TransferStatus, TransferWithState } from "~/renderer/schemas.js";

import { CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";
import { Button } from "~/renderer/components/ui/button.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "~/renderer/components/ui/card.js";
import { store } from "~/renderer/store.js";

import { cn } from "./lib/utils.js";

const keyMap = {
  idle: {
    text: "Idle",
    icon: <Clock className="size-4" />,
  },
  syncing: {
    text: "Syncing",
    icon: <RefreshCw className="size-4" />,
  },
  completed: {
    text: "Completed",
    icon: <CheckCircle className="size-4" />,
  },
  error: {
    text: "Error",
    icon: <XCircle className="size-4" />,
  },
} satisfies Record<TransferStatus, {
  text: string;
  icon: React.ReactNode;
}>;

export function TransferStatusCard({
  transfers,
  status,
  className,
}: {
  transfers: TransferWithState[];
  status: TransferStatus;
  className?: string;
}) {
  const key = keyMap[status];

  return (
    <Card className={cn("@container/transfer-status-card relative group flex flex-col items-center overflow-clip", className)}>
      <CardHeader className="px-4 pt-4 pb-1 text-2xl font-black">
        {transfers.length}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <CardDescription className="flex items-center gap-2">
          <div className="text-muted-foreground">{key.icon}</div>
          <span className="text-accent-foreground font-medium">{key.text}</span>
        </CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col @[160px]/transfer-status-card:flex-row p-0 w-full @max-[160px]/transfer-status-card:divide-y @[160px]/transfer-status-card:divide-x divide-border border-t">
        <Button
          className="h-auto w-full rounded-none"
          onClick={() => {
            store.send({
              type: "removeAllByStatus",
              status,
            });
          }}
          variant="ghost"
        >
          Remove
        </Button>
        <Button
          className="h-auto w-full rounded-none"
          onClick={() => {
            store.send({
              type: "keepAllByStatus",
              status,
            });
          }}
          variant="ghost"
        >
          Keep
        </Button>
      </CardFooter>
    </Card>
  );
}
