import type { VariantProps } from "class-variance-authority";

import { Label } from "@radix-ui/react-label";
import { useSelector } from "@xstate/store/react";
import { groupBy } from "lodash-es";
import { CircleMinus } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { match } from "ts-pattern";

import type { buttonVariants } from "~/renderer/components/ui/button.styles.js";
import type { TransferWithState } from "~/renderer/schemas.js";

import { Combobox } from "~/renderer/components/combobox.js";
import {
  Highlight,
  type HighlightRef,
} from "~/renderer/components/highlight.js";
import { ImportDescription } from "~/renderer/components/import-description.js";
import { SettingsCard } from "~/renderer/components/settings-card.js";
import { TransferItem } from "~/renderer/components/transfer-item.js";
import { Button } from "~/renderer/components/ui/button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/renderer/components/ui/card.js";
import { Checkbox } from "~/renderer/components/ui/checkbox.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/renderer/components/ui/dropdown-menu.js";
import { Input } from "~/renderer/components/ui/input.js";
import { store } from "~/renderer/store.js";
import { TransferStatusCard } from "~/renderer/transfer-status-card.js";
import { convertCsvToTransfers } from "~/renderer/utils/convert-csv-to-transfers.js";
import { idGenerator } from "~/renderer/utils/id.js";

export interface StartAllButtonState {
  isSyncing: boolean;
  isAllCompleted: boolean;
}

export interface StartAllButtonResult {
  variant: VariantProps<typeof buttonVariants>["variant"];
  text: string;
}

interface AppProps {
  appBarMeasure: {
    height: number;
    top: number;
  };
}

export function App({ appBarMeasure }: AppProps) {
  const exportWithStateId = useId();
  const showTransferIdsId = useId();
  const replaceAllId = useId();
  const transfers = useSelector(
    store,
    snapshot => snapshot.context.transfers,
  );
  const settings = useSelector(store, snapshot => snapshot.context.settings);
  const newTransferExtraArgs = useSelector(
    store,
    snapshot => snapshot.context.newTransferExtraArgs,
  );
  const keyedTransfers = groupBy(transfers, "status");

  const isSyncing = transfers.some((transfer) => {
    return transfer.status === "syncing";
  });

  const isAllCompleted = transfers.every((transfer) => {
    return transfer.status === "completed";
  });

  const startAllButton = match<StartAllButtonState, StartAllButtonResult>({
    isSyncing,
    isAllCompleted,
  })
    .with({ isSyncing: true }, () => ({
      variant: "outline",
      text: "Running...",
    }))
    .with({ isAllCompleted: true }, () => ({
      variant: "success",
      text: "All transfers completed",
    }))
    .otherwise(() => ({
      variant: "default",
      text: "Start all idle",
    }));

  const [newTransfer, setNewTransfer] = useState({
    source: { host: "", user: "", password: "" },
    destination: { host: "", user: "", password: "" },
  });

  const hostOptions = useMemo(() => {
    const destinationHost = newTransfer.destination.host
      ? [newTransfer.destination.host]
      : [];
    const sourceHost = newTransfer.source.host ? [newTransfer.source.host] : [];
    const transfersHosts = transfers
      .flatMap(transfer => [transfer.source.host, transfer.destination.host])
      .filter(Boolean);
    const uniqueHosts = Array.from(
      new Set([...destinationHost, ...sourceHost, ...transfersHosts]),
    );

    return uniqueHosts.map(host => ({
      label: host,
      value: host,
    }));
  }, [transfers, newTransfer]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transferRefs = useRef<Map<string, HighlightRef>>(new Map());

  const handleAddTransfer = () => {
    const id = idGenerator();
    store.send({
      type: "addTransfer",
      id,
      source: newTransfer.source,
      destination: newTransfer.destination,
      extraArgs: newTransferExtraArgs,
    });
    setNewTransfer({
      source: { host: "", user: "", password: "" },
      destination: { host: "", user: "", password: "" },
    });
  };

  const handleStartAll = () => {
    store.send({ type: "startAll" });
  };

  const handleRemoveAll = () => {
    store.send({ type: "removeAll" });
  };

  const handleSourceChange = (field: string, value: string) => {
    setNewTransfer(prev => ({
      ...prev,
      source: { ...prev.source, [field]: value },
    }));
  };

  const handleDestinationChange = (field: string, value: string) => {
    setNewTransfer(prev => ({
      ...prev,
      destination: { ...prev.destination, [field]: value },
    }));
  };

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") {
        toast.error("Failed to read file contents");

        return;
      }

      // If replacing all, remove existing transfers first
      if (settings.replaceAllOnImport) {
        store.send({ type: "removeAll" });
      }

      try {
        let transfers: TransferWithState[];

        if (file.name.endsWith(".csv")) {
          transfers = convertCsvToTransfers(result);
        } else {
          // Handle JSON format
          const data = JSON.parse(result);
          transfers = Array.isArray(data) ? data : [data];
        }

        // Process all transfers uniformly
        for (const transfer of transfers) {
          store.send({
            type: "addTransfer",
            ...transfer,
          });

          toast(`Imported transfer`, {
            closeButton: true,
            description: <ImportDescription transfer={transfer} />,
          });
        }

        toast("Transfers imported successfully!", {
          closeButton: true,
          description: `${transfers.length} transfers imported from ${file.name.endsWith(".csv") ? "CSV" : "JSON"}`,
        });
      } catch (error) {
        toast.error("Failed to import transfers", {
          closeButton: true,
          description:
            error instanceof Error ? error.message : "Invalid file format",
        });
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleToggleTransferIds = () => {
    store.send({ type: "toggleShowTransferIds" });
  };

  const handleExportTransfers = async (options: {
    exportAs: "json" | "csv";
  }) => {
    try {
      const { success } = await window.api.exportTransfers(transfers, {
        exportAs: options.exportAs,
        withState: settings.exportWithState,
      });

      if (success) {
        toast.success("Transfers exported successfully");
      }
    } catch {
      toast.error("Failed to export transfers");
    }
  };

  const highlightTransfer = (id: string) => {
    const transfer = transferRefs.current.get(id);
    if (!transfer) return;

    transfer.highlight({
      scrollTo: true,
      highlightDuration: 1500,
    });
  };

  const appBarHeightStyle = useMemo(() => {
    return {
      "--app-bar-height": `calc(${appBarMeasure.height + appBarMeasure.top}px + 1rem)`,
    } as React.CSSProperties;
  }, [appBarMeasure.height, appBarMeasure.top]);

  return (
    <div className="@container container mx-auto py-5">
      <SettingsCard />

      <div className="grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 pt-4 gap-6 items-start">
        {/* Add Transfer Form */}
        <Card
          asChild
          className="[@media(min-height:512px)]:@2xl:sticky top-(--app-bar-height)"
          style={appBarHeightStyle}
        >
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

              <div className="pt-4">
                <Input
                  accept=".csv,.json"
                  className="hidden"
                  onChange={handleBulkImport}
                  ref={fileInputRef}
                  type="file"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full"
                      type="button"
                      variant="outline"
                    >
                      Import Transfers
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
                    <DropdownMenuItem
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = ".csv";
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      Import from CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = ".json";
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      Import from JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    checked={settings.replaceAllOnImport}
                    id={replaceAllId}
                    onCheckedChange={() =>
                      store.send({ type: "toggleReplaceAllOnImport" })}
                  />
                  <Label htmlFor={replaceAllId}>
                    Replace all transfers on import
                  </Label>
                </div>
                <CardDescription className="pt-2 space-y-2">
                  <p>
                    The CSV file is expected to contain column headers, so
                    the first line will be skipped.
                  </p>
                  <details>
                    <summary>Example import files:</summary>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          CSV Format (import.csv):
                        </h4>
                        <pre className="break-all whitespace-pre-wrap text-xs text-muted-foreground bg-muted p-2 rounded-md">
                          <div>
                            source_host,source_user,source_password,destination_host,destination_user,destination_password
                          </div>
                          <div>
                            imap.example.com,user1,password1,imap.example.com,user1,password1
                          </div>
                          <div>
                            imap.example.com,user2,password2,imap.example.com,user2,password2
                          </div>
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          JSON Format (import.json):
                        </h4>
                        <pre className="break-all whitespace-pre-wrap text-xs text-muted-foreground bg-muted p-2 rounded-md">
                          {JSON.stringify(
                            [
                              {
                                source: {
                                  host: "imap.example.com",
                                  user: "user1",
                                  password: "password1",
                                },
                                destination: {
                                  host: "imap.example.com",
                                  user: "user1",
                                  password: "password1",
                                },
                              },
                            ],
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                  </details>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="@container/form">
                <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Source</h3>
                    <Combobox
                      className="w-full"
                      onValueChange={(value) => {
                        handleSourceChange("host", value);
                      }}
                      options={hostOptions}
                      placeholder="Select or enter host..."
                      searchPlaceholder="Search hosts..."
                      value={newTransfer.source.host}
                    />
                    <Input
                      onChange={(event) => {
                        handleSourceChange("user", event.target.value);
                        handleDestinationChange("user", event.target.value);
                      }}
                      placeholder="Username"
                      type="text"
                      value={newTransfer.source.user}
                    />
                    <Input
                      onChange={(event) => {
                        handleSourceChange("password", event.target.value);
                      }}
                      placeholder="Password"
                      type="password"
                      value={newTransfer.source.password}
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium">Destination</h3>
                    <Combobox
                      className="w-full"
                      onValueChange={(value) => {
                        handleDestinationChange("host", value);
                      }}
                      options={hostOptions}
                      placeholder="Select or enter host..."
                      searchPlaceholder="Search hosts..."
                      value={newTransfer.destination.host}
                    />
                    <Input
                      onChange={(event) => {
                        handleDestinationChange("user", event.target.value);
                      }}
                      placeholder="Username"
                      type="text"
                      value={newTransfer.destination.user}
                    />
                    <Input
                      onChange={(event) => {
                        handleDestinationChange(
                          "password",
                          event.target.value,
                        );
                      }}
                      placeholder="Password"
                      type="password"
                      value={newTransfer.destination.password}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm text-gray-500">
                      Extra imapsync Arguments
                    </Label>
                    <Input
                      onChange={(event) => {
                        store.send({
                          type: "updateNewTransferExtraArgs",
                          value: event.target.value,
                        });
                      }}
                      placeholder="e.g., --noauthmd5 --timeout_connect=60"
                      type="text"
                      value={newTransferExtraArgs}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional arguments passed directly to the imapsync command.
                    </p>
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
        <Card className="@4xl:col-span-2">
          <CardHeader className="@container/transfer-status-cards flex flex-col gap-2">
            <div className="grid grid-cols-1 @xs:grid-cols-2 @lg:grid-cols-4 gap-2">
              <TransferStatusCard
                onTransferClick={highlightTransfer}
                status="idle"
                transfers={keyedTransfers.idle ?? []}
              />
              <TransferStatusCard
                onTransferClick={highlightTransfer}
                status="syncing"
                transfers={keyedTransfers.syncing ?? []}
              />
              <TransferStatusCard
                onTransferClick={highlightTransfer}
                status="completed"
                transfers={keyedTransfers.completed ?? []}
              />
              <TransferStatusCard
                onTransferClick={highlightTransfer}
                status="error"
                transfers={keyedTransfers.error ?? []}
              />
            </div>

            <div className="flex gap-2">
              {transfers.length > 0
                ? (
                    <Button
                      disabled={isSyncing || isAllCompleted}
                      onClick={handleStartAll}
                      variant={startAllButton.variant}
                    >
                      {startAllButton.text}
                    </Button>
                  )
                : null}

              {transfers.length > 0 && (
                <Button onClick={handleRemoveAll} variant="destructive">
                  Remove All
                  <CircleMinus className="size-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Export Transfers</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
                  <DropdownMenuItem
                    onClick={() =>
                      handleExportTransfers({ exportAs: "json" })}
                  >
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleExportTransfers({ exportAs: "csv" })}
                  >
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mt-2 break-all">
                <Checkbox
                  checked={settings.exportWithState}
                  id={exportWithStateId}
                  onCheckedChange={() => {
                    store.send({ type: "toggleExportWithState" });
                  }}
                />
                <Label htmlFor={exportWithStateId}>
                  Export with transfer state
                </Label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  checked={settings.showTransferIds}
                  id={showTransferIdsId}
                  onCheckedChange={handleToggleTransferIds}
                />
                <Label htmlFor={showTransferIdsId}>Show Transfer IDs</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {transfers.length === 0
              ? (
                  <div className="text-center py-6 text-gray-500">
                    No transfers added yet. Configure a new transfer to get
                    started.
                  </div>
                )
              : (
                  transfers.map((transfer, index) => (
                    <div key={transfer.id}>
                      {index > 0 && <div className="h-px bg-border my-6" />}
                      <Highlight
                        className="w-full data-[highlighted=true]:outline-offset-16"
                        ref={(element) => {
                          if (element) {
                            transferRefs.current.set(transfer.id, element);
                          } else {
                            transferRefs.current.delete(transfer.id);
                          }
                        }}
                      >
                        <TransferItem
                          hostOptions={hostOptions}
                          transfer={transfer}
                        />
                      </Highlight>
                    </div>
                  ))
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
