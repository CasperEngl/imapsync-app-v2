import { useState } from "react";

import type { TransferWithState } from "../schemas.js";

import { TransferStatusCard } from "../transfer-status-card.js";

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
  );
}
