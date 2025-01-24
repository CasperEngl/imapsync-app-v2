import { useSelector } from '@xstate/store/react';
import type { VariantProps } from 'class-variance-authority';
import { CheckCircle2, Copy, Loader2, Play, RotateCcw, X } from "lucide-react";
import { useDeferredValue } from 'react';
import { Combobox } from "~/renderer/components/combobox.js";
import type { badgeVariants } from '~/renderer/components/ui/badge.js';
import { Button } from "~/renderer/components/ui/button.js";
import { Input } from "~/renderer/components/ui/input.js";
import { Progress } from "~/renderer/components/ui/progress.js";
import { cn } from "~/renderer/lib/utils.js";
import { store, type TransferState, type TransferStatus } from "~/renderer/store.js";

const statusConfig = {
  idle: {
    text: "Start",
    variant: "default",
    icon: <Play className="size-4" />,
    disabled: false,
    className: '',
  },
  syncing: {
    text: "Syncing",
    variant: "info",
    icon: <Loader2 className="animate-spin size-4" />,
    disabled: true,
    className: '',
  },
  completed: {
    text: "Completed",
    variant: "success",
    icon: <CheckCircle2 className="size-4" />,
    disabled: false,
    className: '',
  },
  error: {
    text: "Retry",
    variant: "outline",
    icon: <RotateCcw className="size-4" />,
    disabled: false,
    className: 'border-destructive hover:bg-destructive/10 hover:text-destructive'
  },
} as const satisfies Record<
  TransferStatus,
  {
    text: string;
    variant: VariantProps<typeof badgeVariants>["variant"];
    icon: JSX.Element;
    className: string
    disabled: boolean
  }
>;

interface TransferItemProps {
  transfer: TransferState;
  hostOptions: Array<{ label: string; value: string }>;
  onStartTransfer: (id: string) => void;
  onRemoveTransfer: (id: string) => void;
}

export function TransferItem({
  transfer,
  hostOptions,
  onStartTransfer,
  onRemoveTransfer,
}: TransferItemProps) {
  const outputs = useDeferredValue(transfer.outputs)
  const showTransferIds = useSelector(store, snapshot => snapshot.context.settings.showTransferIds)

  const canStart = transfer.status === "idle" || transfer.status === "error" || transfer.status === "completed"
  const config = statusConfig[transfer.status]

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
                  options={hostOptions}
                  value={transfer.source.host}
                  onValueChange={(value) =>
                    store.send({
                      type: "updateTransferSource",
                      id: transfer.id,
                      field: "host",
                      value,
                    })
                  }
                  placeholder="Select or enter host..."
                  searchPlaceholder="Search hosts..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Username</label>
                <Input
                  type="text"
                  value={transfer.source.user}
                  onChange={(e) =>
                    store.send({
                      type: "updateTransferSource",
                      id: transfer.id,
                      field: "user",
                      value: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Password</label>
                <Input
                  type="password"
                  value={transfer.source.password}
                  onChange={(e) =>
                    store.send({
                      type: "updateTransferSource",
                      id: transfer.id,
                      field: "password",
                      value: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600">Destination</h4>
              <div>
                <label className="block text-sm text-gray-500">Host</label>
                <Combobox
                  options={hostOptions}
                  value={transfer.destination.host}
                  onValueChange={(value) =>
                    store.send({
                      type: "updateTransferDestination",
                      id: transfer.id,
                      field: "host",
                      value,
                    })
                  }
                  placeholder="Select or enter host..."
                  searchPlaceholder="Search hosts..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Username</label>
                <Input
                  type="text"
                  value={transfer.destination.user}
                  onChange={(e) =>
                    store.send({
                      type: "updateTransferDestination",
                      id: transfer.id,
                      field: "user",
                      value: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Password</label>
                <Input
                  type="password"
                  value={transfer.destination.password}
                  onChange={(e) =>
                    store.send({
                      type: "updateTransferDestination",
                      id: transfer.id,
                      field: "password",
                      value: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar for syncing state */}
        <div className="w-full mt-0.5 mb-4">
          <Progress
            value={
              transfer.progress
                ? (transfer.progress.current / transfer.progress.total) * 100
                : 0
            }
          />
          <p className="text-sm mt-1">
            {transfer.error
              ? <span className="text-red-500">Error: {transfer.error}</span>
              : <span className="text-muted-foreground">{transfer.progress?.message || "No progress to show"}</span>}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (!canStart) return

              onStartTransfer(transfer.id);
            }}
            variant={config.variant}
            className={config.className}
          >
            {config.icon}
            <span>{config.text}</span>
          </Button>

          <Button
            variant="destructive"
            onClick={() => onRemoveTransfer(transfer.id)}
          >
            <X className='size-4' />
            Remove
          </Button>
          <Button
            variant="outline"
            onClick={() => store.send({ type: "duplicateTransfer", id: transfer.id })}
            title="Duplicate transfer"
          >
            <Copy className="size-4" />
            Duplicate
          </Button>
        </div>

        {/* Add the details element for output */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            View Output
          </summary>
          <pre className="mt-2 p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-[400px] overflow-auto snap-proximity snap-y content-end flex flex-col after:block after:snap-end">
            {outputs.length > 0 ? (
              outputs.map((output) => (
                <div
                  key={output.timestamp}
                  className={cn(
                    output.isError
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {output.content}
                </div>
              ))
            ) : (
              "No output available"
            )}
          </pre>
        </details>
      </div>
    </div>
  );
} 
