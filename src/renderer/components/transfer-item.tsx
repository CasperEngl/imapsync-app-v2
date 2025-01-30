import type { VariantProps } from "class-variance-authority";
import type { TransferStatus, TransferWithState } from "~/renderer/schemas.js";

import { useQuery } from "@tanstack/react-query";
import { useSelector } from "@xstate/store/react";
import { ArrowLeftRight, CheckCircle2, Copy, Loader, Pause, Play, RotateCcw, X } from "lucide-react";
import { useDeferredValue } from "react";
import { Combobox } from "~/renderer/components/combobox.js";
import { Button } from "~/renderer/components/ui/button.js";
import { Input } from "~/renderer/components/ui/input.js";
import { Progress } from "~/renderer/components/ui/progress.js";
import { cn } from "~/renderer/lib/utils.js";
import { store } from "~/renderer/store.js";
import type { badgeVariants } from "./ui/badge.styles.js";

const statusConfig = {
  idle: {
    text: "Start",
    variant: "default",
    icon: <Play className="size-4" />,
    disabled: false,
    className: "",
    onClick: (transfer: TransferWithState) => {
      if (transfer.status === "idle") {
        store.send({ type: "startTransfer", id: transfer.id });
      }
    },
  },
  syncing: {
    text: "Pause",
    variant: "warning",
    icon: <Pause className="size-4" />,
    disabled: false,
    className: "",
    onClick: async (transfer: TransferWithState) => {
      if (transfer.status === "syncing") {
        await window.api.toggleTransferPause(transfer.id);
      }
    },
  },
  paused: {
    text: "Resume",
    variant: "warning",
    icon: <Play className="size-4" />,
    disabled: false,
    className: "",
    onClick: async (transfer: TransferWithState) => {
      if (transfer.status === "paused") {
        await window.api.toggleTransferPause(transfer.id);
      }
    },
  },
  completed: {
    text: "Restart",
    variant: "success",
    icon: <CheckCircle2 className="size-4" />,
    disabled: false,
    className: "",
    onClick: (transfer: TransferWithState) => {
      if (transfer.status === "completed") {
        store.send({ type: "startTransfer", id: transfer.id });
      }
    },
  },
  error: {
    text: "Retry",
    variant: "outline",
    icon: <RotateCcw className="size-4" />,
    disabled: false,
    className: "border-destructive hover:bg-destructive/10 hover:text-destructive",
    onClick: (transfer: TransferWithState) => {
      if (transfer.status === "error") {
        store.send({ type: "startTransfer", id: transfer.id });
      }
    },
  },
} as const satisfies Record<
  TransferStatus,
  {
    text: string;
    variant: VariantProps<typeof badgeVariants>["variant"];
    icon: React.ReactNode;
    className: string;
    disabled: boolean;
    onClick: (transfer: TransferWithState) => void;
  }
>;

interface TransferItemProps {
  transfer: TransferWithState;
  hostOptions: Array<{ label: string; value: string }>;
}

export function TransferItem({
  transfer,
  hostOptions,
}: TransferItemProps) {
  const outputs = useDeferredValue(transfer.outputs);
  const showTransferIds = useSelector(store, snapshot => snapshot.context.settings.showTransferIds);

  // Use React Query to handle transfer state polling
  useQuery({
    queryKey: ["transferState", transfer.id],
    queryFn: async () => {
      const state = await window.api.checkTransferState(transfer.id);

      if (!state.isRunning) {
        store.send({
          type: "transferError",
          id: transfer.id,
          error: "Transfer process is no longer running",
        });
      } else if (state.isPaused !== (transfer.status === "paused")) {
        store.send({
          type: "updateTransferState",
          id: transfer.id,
          isPaused: state.isPaused,
        });
      }

      return state;
    },
    // Only poll when transfer is in syncing or paused state
    enabled: transfer.status === "syncing" || transfer.status === "paused",
    // Poll every 1 second
    refetchInterval: 1000,
    // Don't refetch on window focus to avoid disrupting the user
    refetchOnWindowFocus: false,
    // Retry up to 3 times if the query fails
    retry: 3,
    // Use staleTime to prevent unnecessary refetches
    staleTime: 2000,
    gcTime: 0, // Don't keep old data in cache
  });

  const config = statusConfig[transfer.status];

  return (
    <div>
      <div className="pt-6">
        {showTransferIds && (
          <div className="pb-2">
            <div className="text-xs text-muted-foreground">ID</div>
            <div className="text-lg font-mono text-accent-foreground">{transfer.id}</div>
          </div>
        )}
        <div className="@container/transfer mb-4">
          <div className="grid @lg/transfer:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600">Source</h4>
              <div>
                <label className="block text-sm text-gray-500">Host</label>
                <Combobox
                  className="w-full"
                  onValueChange={value =>
                    store.send({
                      type: "updateTransferSource",
                      id: transfer.id,
                      field: "host",
                      value,
                    })}
                  options={hostOptions}
                  placeholder="Select or enter host..."
                  searchPlaceholder="Search hosts..."
                  value={transfer.source.host}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Username</label>
                <Input
                  onChange={(event) => {
                    store.send({
                      type: "updateTransferSource",
                      id: transfer.id,
                      field: "user",
                      value: event.target.value,
                    });
                    store.send({
                      type: "updateTransferDestination",
                      id: transfer.id,
                      field: "user",
                      value: event.target.value,
                    });
                  }}
                  type="text"
                  value={transfer.source.user}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Password</label>
                <Input
                  onChange={(event) => {
                    store.send({
                      type: "updateTransferSource",
                      id: transfer.id,
                      field: "password",
                      value: event.target.value,
                    });
                  }}
                  type="password"
                  value={transfer.source.password}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600">Destination</h4>
              <div>
                <label className="block text-sm text-gray-500">Host</label>
                <Combobox
                  className="w-full"
                  onValueChange={value =>
                    store.send({
                      type: "updateTransferDestination",
                      id: transfer.id,
                      field: "host",
                      value,
                    })}
                  options={hostOptions}
                  placeholder="Select or enter host..."
                  searchPlaceholder="Search hosts..."
                  value={transfer.destination.host}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Username</label>
                <Input
                  onChange={(event) => {
                    store.send({
                      type: "updateTransferDestination",
                      id: transfer.id,
                      field: "user",
                      value: event.target.value,
                    });
                  }}
                  type="text"
                  value={transfer.destination.user}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Password</label>
                <Input
                  onChange={(event) => {
                    store.send({
                      type: "updateTransferDestination",
                      id: transfer.id,
                      field: "password",
                      value: event.target.value,
                    });
                  }}
                  type="password"
                  value={transfer.destination.password}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => store.send({ type: "duplicateTransfer", id: transfer.id })}
            title="Duplicate transfer"
            variant="outline"
          >
            <Copy className="size-4" />
            Duplicate
          </Button>
          <Button
            onClick={() => store.send({ type: "swapSourceAndDestination", id: transfer.id })}
            title="Swap source and destination"
            variant="outline"
          >
            <ArrowLeftRight className="size-4" />
            Swap
          </Button>
        </div>

        <div className="flex gap-2">
          {transfer.status === "syncing" || transfer.status === "paused"
            ? (
                <Loader
                  className={cn(
                    "size-6 my-1 animate-spin text-muted-foreground [animation-duration:2.5s]",
                    {
                      "[animation-play-state:paused]": transfer.status === "paused",
                    },
                  )}
                />
              )
            : null}

          {/* Progress bar for syncing state */}
          <div className="w-full mt-0.5 mb-4">
            <Progress
              isActive={transfer.status === "syncing"}
              value={
                transfer.progress
                  ? (transfer.progress.current / transfer.progress.total) * 100
                  : 0
              }
            />
            <p className="text-sm mt-1">
              {transfer.error
                ? (
                    <span className="text-red-500">
                      Error:{" "}
                      {transfer.error}
                    </span>
                  )
                : <span className="text-muted-foreground">{transfer.progress?.message || "No progress to show"}</span>}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className={config.className}
            disabled={config.disabled}
            onClick={() => {
              void config.onClick?.(transfer);
            }}
            variant={config.variant}
          >
            {config.icon}
            <span>{config.text}</span>
          </Button>

          <Button
            onClick={() => {
              store.send({ type: "removeTransfer", id: transfer.id });
            }}
            variant="destructive"
          >
            <X className="size-4" />
            Remove
          </Button>
        </div>

        {/* Add the details element for output */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            View Output
          </summary>
          <pre className="mt-2 p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-[400px] overflow-auto snap-proximity snap-y content-end flex flex-col after:block after:snap-end">
            {outputs.length > 0
              ? (
                  outputs.map(output => (
                    <div
                      className={cn(
                        output.isError
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                      key={output.timestamp}
                    >
                      {output.content}
                    </div>
                  ))
                )
              : (
                  "No output available"
                )}
          </pre>
        </details>
      </div>
    </div>
  );
}
