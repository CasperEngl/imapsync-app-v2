import { TransferStatusCard } from "../transfer-status-card.js";
import type { TransferWithState } from "../schemas.js";
import { useState } from "react";

interface TransferStatusOverviewProps {
  keyedTransfers: {
    idle?: TransferWithState[];
    syncing?: TransferWithState[];
    completed?: TransferWithState[];
    error?: TransferWithState[];
  };
}

export function TransferStatusOverview({ keyedTransfers }: TransferStatusOverviewProps) {
  const [highlightedTransferId, setHighlightedTransferId] = useState<string | null>(null);

  const highlightTransfer = (id: string) => {
    setHighlightedTransferId(id);
  };

  return (
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
  );
} 