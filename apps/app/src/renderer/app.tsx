import { useSelector } from "@xstate/store/react";
import { groupBy } from "lodash-es";
import { useId, useMemo, useRef, useState } from "react";
import { useMeasure } from "react-use";

import { Highlight } from "~/renderer/components/highlight.js";
import { SettingsCard } from "~/renderer/components/settings-card.js";
import { TransferItem } from "~/renderer/components/transfer-item.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "~/renderer/components/ui/card.js";
import { Providers } from "~/renderer/providers.js";
import { idGenerator } from "~/renderer/utils/id.js";

import { CircleMinus } from "lucide-react";
import { ExportTransfers } from "~/renderer/components/export-transfers.js";
import { StartAllButton } from "~/renderer/components/start-all-button.js";
import { Button } from "~/renderer/components/ui/button.js";
import { Checkbox } from "~/renderer/components/ui/checkbox.js";
import { Label } from "~/renderer/components/ui/label.js";
import { TransferStatusCard } from "~/renderer/transfer-status-card.js";
import { AddTransferForm } from "./components/add-transfer-form.js";
import { ImportControls } from "./components/import-controls.js";
import { store } from "./store.js";

export function App() {
  const [appBarRef, appBarMeasure] = useMeasure<HTMLDivElement>();
  const exportWithStateId = useId();
  const showTransferIdsId = useId();
  const settings = useSelector(
    store,
    snapshot => snapshot.context.settings,
  );
  const transfers = useSelector(
    store,
    snapshot => snapshot.context.transfers,
  );
  const keyedTransfers = groupBy(transfers, "status");

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

  const transferRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [highlightedTransferId, setHighlightedTransferId] = useState<string | null>(null);

  const highlightTransfer = (id: string) => {
    setHighlightedTransferId(id);

    const transferRef = transferRefs.current.get(id);
    if (transferRef) {
      transferRef.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const appBarHeightStyle = useMemo(() => {
    return {
      "--app-bar-height": `calc(${appBarMeasure.height + appBarMeasure.top}px + 1rem)`,
    } as React.CSSProperties;
  }, [appBarMeasure.height, appBarMeasure.top]);

  return (
    <Providers>
      <div className="relative">
        <div className="[app-region:drag] z-10 sticky top-0 h-10 select-all bg-accent" ref={appBarRef}></div>
        <header className="relative bg-white shadow py-4 text-pretty">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold">imapsync App</h1>

            <div className="text-sm text-muted-foreground">
              Powered by
              {" "}
              <a
                className="underline hover:text-foreground transition-colors"
                href="https://imapsync.lamiral.info/"
                onClick={(e) => {
                  e.preventDefault();
                  void window.api.openExternalUrl(
                    "https://imapsync.lamiral.info/",
                  );
                }}
                rel="noopener noreferrer"
                target="_blank"
              >
                imapsync by Gilles Lamiral
              </a>
            </div>

            <div className="max-w-prose">
              <p className="text-sm text-muted-foreground mt-1">
                This is a GUI frontend for imapsync. All email transfer
                functionality is provided by the imapsync tool created by Gilles
                Lamiral.
              </p>
            </div>
          </div>
        </header>

        <div className="@container container mx-auto py-5">
          <SettingsCard />

          <div className="grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 pt-4 gap-6 items-start">
            {/* Add Transfer Form */}
            <div className="[@media(min-height:512px)]:@2xl:sticky top-(--app-bar-height)" style={appBarHeightStyle}>
              <Card>
                <CardHeader>
                  <CardTitle>Configure New Email Transfer</CardTitle>
                  <CardDescription>
                    Set up a new email synchronization by entering the source and
                    destination server details below
                  </CardDescription>

                  <div className="mt-4">
                    <ImportControls />
                  </div>
                </CardHeader>
                <CardContent>
                  <AddTransferForm
                    hostOptions={hostOptions}
                    newTransfer={newTransfer}
                    onSourceChange={(field: string, value: string) => {
                      setNewTransfer(prev => ({
                        ...prev,
                        source: { ...prev.source, [field]: value },
                      }));
                    }}
                    onDestinationChange={(field: string, value: string) => {
                      setNewTransfer(prev => ({
                        ...prev,
                        destination: { ...prev.destination, [field]: value },
                      }));
                    }}
                    onAddTransfer={() => {
                      const id = idGenerator();
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
                    }}
                  />
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button type="submit">Add Transfer</Button>
                </CardFooter>
              </Card>
            </div>

            {/* Transfer List */}
            <Card className="@4xl:col-span-2">
              <CardHeader className="@container/transfer-status-cards flex flex-col gap-2">
                <div className="grid grid-cols-1 @xs:grid-cols-2 @lg:grid-cols-4 gap-2">
                  <TransferStatusCard
                    status="idle"
                    transfers={keyedTransfers.idle ?? []}
                    onTransferClick={highlightTransfer}
                  />
                  <TransferStatusCard
                    status="syncing"
                    transfers={keyedTransfers.syncing ?? []}
                    onTransferClick={highlightTransfer}
                  />
                  <TransferStatusCard
                    status="completed"
                    transfers={keyedTransfers.completed ?? []}
                    onTransferClick={highlightTransfer}
                  />
                  <TransferStatusCard
                    status="error"
                    transfers={keyedTransfers.error ?? []}
                    onTransferClick={highlightTransfer}
                  />
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
                    <Label htmlFor={exportWithStateId}>Export with transfer state</Label>
                  </div>
                  <div className="flex items-center gap-2 mt-2 break-all">
                    <Checkbox
                      checked={settings.showTransferIds}
                      id={showTransferIdsId}
                      onCheckedChange={() => store.send({ type: "toggleShowTransferIds" })}
                    />
                    <Label htmlFor={showTransferIdsId}>Show Transfer IDs</Label>
                  </div>
                </div>

                <ExportTransfers />

                <div className="flex gap-2">
                  {transfers.length > 0 ? (
                    <StartAllButton />
                  ) : null}

                  {transfers.length > 0 && (
                    <Button
                      onClick={() => {
                        store.send({ type: "removeAll" });
                      }}
                      variant="destructive"
                    >
                      Remove All
                      <CircleMinus className="size-4" />
                    </Button>
                  )}
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
                    <div
                      key={transfer.id}
                      ref={(element) => {
                        if (element) {
                          transferRefs.current.set(transfer.id, element);
                        } else {
                          transferRefs.current.delete(transfer.id);
                        }
                      }}
                    >
                      {index > 0 && <div className="h-px bg-border my-6" />}
                      <Highlight
                        active={highlightedTransferId === transfer.id}
                        className="w-full data-[highlighted=true]:outline-offset-16"
                        scrollTo
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

        <footer className="container mx-auto py-8">
          <div className="max-w-prose">
            <p className="text-sm text-muted-foreground">
              © 2025 Imapsync App. Available under Personal Use License for personal use.
              Commercial use requires a separate license - contact
              {" "}
              <a
                className="underline hover:text-foreground transition-colors"
                href="mailto:me@casperengelmann.com"
              >
                me@casperengelmann.com
              </a>
            </p>

            <p className="text-sm text-red-500 mt-1">
              Note: Using this software in a business environment or for commercial purposes
              without a valid commercial license is strictly prohibited.
            </p>
          </div>
        </footer>
      </div>
    </Providers>
  );
}
