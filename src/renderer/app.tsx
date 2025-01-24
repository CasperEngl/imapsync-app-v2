import { useSelector } from "@xstate/store/react";
import type { VariantProps } from "class-variance-authority";
import { ArrowRightLeft } from "lucide-react";
import { nanoid } from "nanoid";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { match } from "ts-pattern";
import { Combobox } from "~/renderer/components/combobox.js";
import { Badge } from "~/renderer/components/ui/badge.js";
import { Button, buttonVariants } from "~/renderer/components/ui/button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/renderer/components/ui/card.js";
import { Input } from "~/renderer/components/ui/input.js";
import { Providers, queryClient } from "~/renderer/providers.js";
import { store } from "./store.js";

type StartAllButtonState = {
  isSyncing: boolean;
  isAllCompleted: boolean;
};

type StartAllButtonResult = {
  variant: VariantProps<typeof buttonVariants>["variant"];
  text: string;
};

import { useMutation, useQuery } from "@tanstack/react-query";
import { TransferItem } from "~/renderer/components/transfer-item.js";
import { Skeleton } from '~/renderer/components/ui/skeleton.js';

function ImapsyncBinarySelector() {
  const imapsyncPathQuery = useQuery({
    queryKey: ["imapsyncPath"],
    queryFn: () => window.api.getImapsyncPath(),
  });

  const selectBinaryMutation = useMutation({
    mutationFn: async () => {
      const path = await window.api.selectImapsyncBinary();
      if (path) {
        store.send({ type: "setImapsyncPath", path });
      }
      return path;
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to upload binary");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['imapsyncPath'] })
    }
  });

  const handleSelectBinary = () => {
    selectBinaryMutation.mutate();
  };

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h2 className="text-lg font-semibold mb-2">imapsync Binary</h2>
      <div className="space-y-2">
        {imapsyncPathQuery.isLoading ? (
          <Skeleton className="h-5 w-full max-w-[300px]" />
        ) : imapsyncPathQuery.data ? (
          <div className="text-sm text-muted-foreground">
            Current path: {imapsyncPathQuery.data}
          </div>
        ) : null}
        <Button
          onClick={handleSelectBinary}
          disabled={selectBinaryMutation.isPending}
        >
          {selectBinaryMutation.isPending ? "Uploading..." : "Select imapsync Binary"}
        </Button>
        {selectBinaryMutation.isError && (
          <div className="text-red-500 mt-2">
            {selectBinaryMutation.error instanceof Error
              ? selectBinaryMutation.error.message
              : "Failed to upload binary"}
          </div>
        )}
      </div>
    </div>
  );
}

export function App() {
  const transfers = useSelector(
    store,
    (snapshot) => snapshot.context.transfers
  );

  const isSyncing = transfers.some((t) => t.status === "syncing");

  const isAllCompleted = transfers.every((t) => t.status === "completed");

  const startAllButton = match<
    StartAllButtonState,
    StartAllButtonResult
  >({ isSyncing, isAllCompleted })
    .with({ isSyncing: true }, () => ({
      variant: "outline",
      text: "Running...",
    }))
    .with({ isAllCompleted: true }, () => ({
      variant: "success",
      text: "Completed",
    }))
    .otherwise(() => ({
      variant: "default",
      text: "Start all idle",
    }));

  const hostOptions = useMemo(
    () =>
      Array.from(
        new Set(
          transfers
            .flatMap((transfer) => [
              transfer.source.host,
              transfer.destination.host,
            ])
            .filter(Boolean)
        )
      ).map((host) => ({ label: host, value: host })),
    [transfers]
  );

  const [newTransfer, setNewTransfer] = useState({
    source: { host: "", user: "", password: "" },
    destination: { host: "", user: "", password: "" },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTransfer = () => {
    const id = nanoid();
    store.send({
      type: "addTransfer",
      id,
      source: newTransfer.source,
      destination: newTransfer.destination,
    });
    // Reset form
    setNewTransfer({
      source: { host: "", user: "", password: "" },
      destination: { host: "", user: "", password: "" },
    });
  };

  const handleStartTransfer = (id: string) => {
    store.send({ type: "startTransfer", id });
  };

  const handleRemoveTransfer = (id: string) => {
    store.send({ type: "removeTransfer", id });
  };

  const handleStartAll = () => {
    store.send({ type: "startAll" });
  };

  const handleSourceChange = (field: string, value: string) => {
    setNewTransfer((prev) => ({
      ...prev,
      source: { ...prev.source, [field]: value },
    }));
  };

  const handleDestinationChange = (field: string, value: string) => {
    setNewTransfer((prev) => ({
      ...prev,
      destination: { ...prev.destination, [field]: value },
    }));
  };

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const validLines = text
        .split("\n")
        .slice(1) // Skip header
        .filter((line) => line.trim()); // Filter empty lines

      for (const line of validLines) {
        const [
          sourceHost = "",
          sourceUser = "",
          sourcePass = "",
          destHost = "",
          destUser = "",
          destPass = "",
        ] = line.split(",").map((val) => val.trim());

        const id = nanoid();
        store.send({
          type: "addTransfer",
          id,
          source: {
            host: sourceHost,
            user: sourceUser,
            password: sourcePass,
          },
          destination: {
            host: destHost,
            user: destUser,
            password: destPass,
          },
        });

        toast(`Imported transfer`, {
          closeButton: true,
          description: (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-muted-foreground">Source</div>
              <div className="flex gap-1 items-center text-sm">
                <span className="font-medium">{sourceUser}</span>
                <ArrowRightLeft className="size-4 text-muted-foreground/50"></ArrowRightLeft>
                <span className="font-medium">{sourceHost}</span>
              </div>
              <div className="text-xs text-muted-foreground">Destination</div>
              <div className="flex gap-1 items-center text-sm">
                <span className="font-medium">{destUser}</span>
                <ArrowRightLeft className="size-4 text-muted-foreground/50"></ArrowRightLeft>
                <span className="font-medium">{destHost}</span>
              </div>
            </div>
          ),
        });
      }

      toast("Transfers imported successfully!", {
        closeButton: true,
        description: `Imported ${ validLines.length } transfers from CSV`,
      });
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Providers>
      <div className="relative">
        <header className="z-10 sticky top-0 bg-white shadow py-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold">IMAP Sync App</h1>
            <Badge
              variant={process.env.NODE_ENV === 'production'
                ? "destructive"
                : "warning"}
              size="lg"
            >
              {process.env.NODE_ENV === 'production'
                ? "Production"
                : "Development"}
            </Badge>
          </div>
        </header>

        <div className="@container container mx-auto pt-5">
          <ImapsyncBinarySelector />

          <div className="grid @4xl:grid-cols-5 gap-6 items-start">
            {/* Add Transfer Form */}
            <Card asChild className="@4xl:sticky @4xl:top-22 @4xl:col-span-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTransfer();
                }}
              >
                <CardHeader>
                  <CardTitle>Configure New Email Transfer</CardTitle>
                  <CardDescription>
                    Set up a new email synchronization by entering the source
                    and destination server details below
                  </CardDescription>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleBulkImport}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Import from CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="@container/form">
                    <div className="grid @lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium">Source</h3>
                        <Combobox
                          options={hostOptions}
                          value={newTransfer.source.host}
                          onValueChange={(value) =>
                            handleSourceChange("host", value)
                          }
                          placeholder="Select or enter host..."
                          searchPlaceholder="Search hosts..."
                          className="w-full"
                        />
                        <Input
                          type="text"
                          placeholder="Username"
                          value={newTransfer.source.user}
                          onChange={(e) =>
                            handleSourceChange("user", e.target.value)
                          }
                        />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={newTransfer.source.password}
                          onChange={(e) =>
                            handleSourceChange("password", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-medium">Destination</h3>
                        <Combobox
                          options={hostOptions}
                          value={newTransfer.destination.host}
                          onValueChange={(value) =>
                            handleDestinationChange("host", value)
                          }
                          placeholder="Select or enter host..."
                          searchPlaceholder="Search hosts..."
                          className="w-full"
                        />
                        <Input
                          type="text"
                          placeholder="Username"
                          value={newTransfer.destination.user}
                          onChange={(e) =>
                            handleDestinationChange("user", e.target.value)
                          }
                        />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={newTransfer.destination.password}
                          onChange={(e) =>
                            handleDestinationChange("password", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button type="submit">Add Transfer</Button>
                </CardFooter>
              </form>
            </Card>

            {/* Transfer List */}
            <Card className="@4xl:col-span-3 mb-32">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Existing Transfers</CardTitle>

                {transfers.length > 0 ? (
                  <Button
                    onClick={handleStartAll}
                    disabled={isSyncing || isAllCompleted}
                    variant={startAllButton.variant}
                  >
                    {startAllButton.text}
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {transfers.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No transfers added yet. Configure a new transfer to get
                    started.
                  </div>
                ) : (
                  transfers.map((transfer, index) => (
                    <div key={transfer.id}>
                      {index > 0 && <div className="h-px bg-border my-6" />}
                      <TransferItem
                        transfer={transfer}
                        hostOptions={hostOptions}
                        onStartTransfer={handleStartTransfer}
                        onRemoveTransfer={handleRemoveTransfer}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Providers>
  );
}
