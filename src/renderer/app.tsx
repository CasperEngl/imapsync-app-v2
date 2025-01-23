import { useSelector } from "@xstate/store/react";
import { ArrowRightLeft } from "lucide-react";
import { nanoid } from "nanoid";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Combobox } from "~/renderer/components/combobox.js";
import { TransferBadge } from "~/renderer/components/transfer-badge.js";
import { Badge } from "~/renderer/components/ui/badge.js";
import { Button } from "~/renderer/components/ui/button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/renderer/components/ui/card.js";
import { Input } from "~/renderer/components/ui/input.js";
import { Progress } from "~/renderer/components/ui/progress.js";
import { Providers } from "~/renderer/providers.js";
import { store } from "./store.js";

export function App() {
  const transfers = useSelector(
    store,
    (snapshot) => snapshot.context.transfers
  );

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

  const isDemoMode = useSelector(
    store,
    (snapshot) => snapshot.context.isDemoMode
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
          position: "top-right",
        });
      }

      toast("Transfers imported successfully!", {
        description: `Imported ${validLines.length} transfers from CSV`,
        position: "top-right",
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
        <header className="sticky top-0 bg-white shadow py-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold">IMAP Sync App</h1>
            <div className="flex items-center gap-2">
              <Badge variant={isDemoMode ? "warning" : "destructive"} size="lg">
                {isDemoMode ? "Demo Mode" : "Live Mode"}
              </Badge>
            </div>
          </div>
        </header>

        <div className="@container container mx-auto pt-5">
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
                </CardFooter>
              </form>
            </Card>

            {/* Transfer List */}
            <Card className="@4xl:col-span-3">
              <CardHeader>
                <CardTitle>Existing Transfers</CardTitle>
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
                      <div className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-medium">Transfer Details</h3>
                          <TransferBadge status={transfer.status} />
                        </div>

                        <div className="@container/transfer mb-4">
                          <div className="grid @lg/transfer:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-gray-600">
                                Source
                              </h4>
                              <div>
                                <label className="block text-sm text-gray-500">
                                  Host
                                </label>
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
                                <label className="block text-sm text-gray-500">
                                  Username
                                </label>
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
                                <label className="block text-sm text-gray-500">
                                  Password
                                </label>
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
                              <h4 className="font-medium text-sm text-gray-600">
                                Destination
                              </h4>
                              <div>
                                <label className="block text-sm text-gray-500">
                                  Host
                                </label>
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
                                <label className="block text-sm text-gray-500">
                                  Username
                                </label>
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
                                <label className="block text-sm text-gray-500">
                                  Password
                                </label>
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
                        <div className="mb-4">
                          <Progress
                            value={
                              transfer.progress
                                ? (transfer.progress.current /
                                    transfer.progress.total) *
                                  100
                                : 0
                            }
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {transfer.progress?.message ||
                              "No progress to show"}
                            {transfer.error && (
                              <span className="text-red-500">
                                {" "}
                                Error: {transfer.error}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {transfer.status === "idle" && (
                            <Button
                              onClick={() => handleStartTransfer(transfer.id)}
                            >
                              Start
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            onClick={() => handleRemoveTransfer(transfer.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
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
