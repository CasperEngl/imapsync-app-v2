import { ArrowLeftRight, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";

import type { TransferStatus, TransferWithState } from "~/renderer/schemas.js";

import { Button } from "~/renderer/components/ui/button.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "~/renderer/components/ui/card.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/renderer/components/ui/dropdown-menu.js";
import { cn } from "~/renderer/lib/utils.js";
import { store } from "~/renderer/store.js";

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
  onTransferClick,
}: {
  transfers: TransferWithState[];
  status: TransferStatus;
  className?: string;
  onTransferClick: (id: string) => void;
}) {
  const key = keyMap[status];

  return (
    <div>
      <Card className={cn("@container/transfer-status-card relative group flex flex-col items-center overflow-clip", className)}>
        <CardHeader className="px-4 pt-4 pb-1">
          <div className="text-2xl font-black">{transfers.length}</div>
        </CardHeader>
        <CardContent className="px-4 pb-3 flex-1">
          <CardDescription>
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">{key.icon}</div>
              <span className="text-accent-foreground font-medium">{key.text}</span>
            </div>
          </CardDescription>
        </CardContent>
        <CardFooter className="flex flex-col @[190px]/transfer-status-card:flex-row p-0 w-full @max-[190px]/transfer-status-card:divide-y @[190px]/transfer-status-card:divide-x divide-border border-t">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-none w-full"
                variant="ghost"
                disabled={transfers.length === 0}
              >
                View Transfers
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[300px] overflow-y-auto p-0">
              {transfers.map((transfer, index) => (
                <div key={transfer.id}>
                  {index > 0 && <div className="h-px bg-border" />}
                  <DropdownMenuItem
                    className="p-4 flex-col items-start rounded-none"
                    onClick={() => {
                      onTransferClick(transfer.id);
                    }}
                  >
                    <div className="text-xs text-muted-foreground">
                      ID:
                      {" "}
                      {transfer.id}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{transfer.source.user}</span>
                      <ArrowLeftRight className="size-4" />
                      <span className="font-medium">{transfer.destination.user}</span>
                    </div>
                    {transfer.error
                      ? (
                        <p className="font-medium text-red-500 text-xs text-pretty">
                          Error:
                          {" "}
                          {transfer.error}
                        </p>
                      )
                      : null}
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    </div>
  );
}
