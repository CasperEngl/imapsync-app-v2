import type { VariantProps } from "class-variance-authority";

import { useSelector } from "@xstate/store/react";
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  Loader2,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { useDeferredValue, useRef } from "react";
import { useScroll } from "react-use";

import type { badgeVariants } from "~/renderer/components/ui/badge.styles.js";
import type { TransferStatus, TransferWithState } from "~/renderer/schemas.js";

import { Combobox } from "~/renderer/components/combobox.js";
import { Button } from "~/renderer/components/ui/button.js";
import { Input } from "~/renderer/components/ui/input.js";
import { Progress } from "~/renderer/components/ui/progress.js";
import { cn } from "~/renderer/lib/utils.js";
import { store } from "~/renderer/store.js";

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
    text: "Stop",
    variant: "default",
    icon: <X className="size-4" />,
    disabled: false,
    className: "",
    onClick: (transfer: TransferWithState) => {
      if (transfer.status === "syncing") {
        void window.api.stopTransfer(transfer.id);
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
    className:
      "border-destructive hover:bg-destructive/10 hover:text-destructive",
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

export function TransferItem({ transfer, hostOptions }: TransferItemProps) {
  const outputRef = useRef<HTMLPreElement>(null);
  const outputs = useDeferredValue(transfer.outputs);
  const showTransferIds = useSelector(
    store,
    snapshot => snapshot.context.settings.showTransferIds,
  );
  const { y: scrollY } = useScroll(outputRef as React.RefObject<HTMLElement>);

  const config = statusConfig[transfer.status];

  const isScrolledToBottom = outputRef.current
    ? Math.abs(
      outputRef.current.scrollHeight
      - outputRef.current.clientHeight
      - scrollY,
    ) < 1
    : true;

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTo({
        top: outputRef.current.scrollHeight,
      });
    }
  };

  return (
    <div>
      <div className="pt-6">
        {showTransferIds && (
          <div className="pb-2">
            <div className="text-xs text-muted-foreground">ID</div>
            <div className="text-lg font-mono text-accent-foreground">
              {transfer.id}
            </div>
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
            onClick={() =>
              store.send({ type: "duplicateTransfer", id: transfer.id })}
            title="Duplicate transfer"
            variant="outline"
          >
            <Copy className="size-4" />
            Duplicate
          </Button>
          <Button
            onClick={() =>
              store.send({ type: "swapSourceAndDestination", id: transfer.id })}
            title="Swap source and destination"
            variant="outline"
          >
            <ArrowLeftRight className="size-4" />
            Swap
          </Button>
        </div>

        <div className="flex gap-2">
          {transfer.status === "syncing"
            ? (
                <Loader2 className="size-6 my-1 animate-spin text-muted-foreground" />
              )
            : null}

          {/* Progress bar for syncing state */}
          <div className="w-full mt-0.5 mb-4">
            <Progress
              active={transfer.status === "syncing"}
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
                      Error:
                      {transfer.error}
                    </span>
                  )
                : (
                    <span className="text-muted-foreground">
                      {transfer.progress?.message || "No progress to show"}
                    </span>
                  )}
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
        <details
          className="mt-4 relative"
          onToggle={() => {
            scrollToBottom();
          }}
        >
          <summary className="cursor-pointer text-sm text-muted-foreground">
            View Output
          </summary>
          <pre
            className="mt-2 p-4 bg-muted rounded-lg text-sm text-muted-foreground whitespace-pre-wrap max-h-[400px] overflow-auto snap-proximity snap-y content-end flex flex-col after:block after:snap-end"
            ref={outputRef}
          >
            {outputs.length > 0 ? outputs : "No output available"}
          </pre>
          <Button
            className={cn(
              "absolute bottom-2 right-2 size-8 p-0 opacity-0 transition transition-discrete",
              !isScrolledToBottom && outputs.length > 0
                ? "flex starting:opacity-0 opacity-100"
                : "opacity-0",
            )}
            onClick={scrollToBottom}
            title="Scroll to bottom"
            variant="outline"
          >
            <ChevronDown className="size-4" />
          </Button>
        </details>
      </div>
    </div>
  );
}
