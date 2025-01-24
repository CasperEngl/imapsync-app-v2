import { useDeferredValue } from 'react';
import { Combobox } from "~/renderer/components/combobox.js";
import { TransferBadge } from "~/renderer/components/transfer-badge.js";
import { Button } from "~/renderer/components/ui/button.js";
import { Input } from "~/renderer/components/ui/input.js";
import { Progress } from "~/renderer/components/ui/progress.js";
import { cn } from "~/renderer/lib/utils.js";
import { store, type TransferState } from "~/renderer/store.js";

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
  return (
    <div>
      <div className="pt-6">
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
        <div className="mb-4 flex gap-2.5 items-center">
          <TransferBadge status={transfer.status} className="h-10" />

          <div className="w-full mt-0.5">
            <Progress
              value={
                transfer.progress
                  ? (transfer.progress.current / transfer.progress.total) * 100
                  : 0
              }
            />
            <p className="text-sm text-gray-500 mt-1">
              {transfer.progress?.message || "No progress to show"}
              {transfer.error && (
                <span className="text-red-500"> Error: {transfer.error}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {transfer.status === "idle" && (
            <Button onClick={() => onStartTransfer(transfer.id)}>Start</Button>
          )}
          <Button
            variant="destructive"
            onClick={() => onRemoveTransfer(transfer.id)}
          >
            Remove
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
