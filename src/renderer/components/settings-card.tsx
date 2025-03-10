import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";

import { Button } from "~/renderer/components/ui/button.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/renderer/components/ui/card.js";
import { Input } from "~/renderer/components/ui/input.js";
import { Label } from "~/renderer/components/ui/label.js";
import { Skeleton } from "~/renderer/components/ui/skeleton.js";

export function SettingsCard() {
  const logDirInputId = useId();
  const concurrentTransfersId = useId();
  const queryClient = useQueryClient();

  // Query for fetching log directory
  const logDirectoryQuery = useQuery({
    queryKey: ["logDirectory"],
    queryFn: () => window.api.getLogDirectory(),
  });

  // Query for fetching concurrent transfers
  const concurrentTransfersQuery = useQuery({
    queryKey: ["concurrentTransfers"],
    queryFn: () => window.api.getConcurrentTransfers(),
  });

  // Mutation for updating log directory
  const updateDirectoryMutation = useMutation({
    mutationFn: async () => {
      await window.api.selectLogDirectory();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["logDirectory"] });
    },
  });

  // Mutation for updating concurrent transfers
  const updateConcurrentTransfersMutation = useMutation({
    mutationFn: async (value: number) => {
      await window.api.setConcurrentTransfers(value);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update concurrent transfers",
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["concurrentTransfers"] });
    },
  });

  const handleSelectDirectory = async () => {
    updateDirectoryMutation.mutate();
  };

  const handleConcurrentTransfersChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number.parseInt(event.target.value, 10);
    if (!Number.isNaN(value)) {
      updateConcurrentTransfersMutation.mutate(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={logDirInputId}>Log Directory</Label>
          <div className="mt-1 flex items-center space-x-2">
            {logDirectoryQuery.isPending
              ? (
                  <Skeleton className="h-9 flex-1" />
                )
              : (
                  <Input
                    id={logDirInputId}
                    readOnly
                    type="text"
                    value={logDirectoryQuery.data}
                  />
                )}
            <Button
              disabled={updateDirectoryMutation.isPending}
              onClick={handleSelectDirectory}
            >
              Browse
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor={concurrentTransfersId}>Concurrent Transfers</Label>
          <p className="text-[0.8rem] text-muted-foreground">
            You can enter any number of concurrent transfers. The minimum is 1,
            and the recommended is 3, but it depends on your system.
          </p>

          <p className="text-[0.8rem] text-muted-foreground">
            The number of concurrent transfers is limited by the number of
            available CPU cores.
          </p>

          <div className="mt-1 flex items-center space-x-2">
            {concurrentTransfersQuery.isPending
              ? (
                  <Skeleton className="h-9 w-40" />
                )
              : (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Hash className="size-3 text-muted-foreground" />
                    </div>
                    <Input
                      className="w-40 pl-8"
                      id={concurrentTransfersId}
                      min={1}
                      onChange={handleConcurrentTransfersChange}
                      type="number"
                      value={concurrentTransfersQuery.data}
                    />
                  </div>
                )}
          </div>
          {updateConcurrentTransfersMutation.isError && (
            <div className="text-red-500 mt-2">
              {updateConcurrentTransfersMutation.error instanceof Error
                ? updateConcurrentTransfersMutation.error.message
                : "Failed to update concurrent transfers"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
