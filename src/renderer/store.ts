type Transfer = {
  host: string;
  user: string;
  password: string;
};

type TransferStatus = "idle" | "syncing" | "completed" | "error";

type TransferProgress = {
  current: number;
  total: number;
  message: string;
};

type TransferState = {
  id: string;
  source: Transfer;
  destination: Transfer;
  status: TransferStatus;
  error?: string;
  progress?: TransferProgress;
  createdAt: number;
};

interface Store {
  transfers: Record<string, TransferState>;
}

type TransferEventMap = {
  addTransfer: {
    type: "addTransfer";
    id: string;
    source: Transfer;
    destination: Transfer;
  };
  removeTransfer: {
    type: "removeTransfer";
    id: string;
  };
  updateTransferSource: {
    type: "updateTransferSource";
    id: string;
    field: keyof Transfer;
    value: string;
  };
  updateTransferDestination: {
    type: "updateTransferDestination";
    id: string;
    field: keyof Transfer;
    value: string;
  };
  startTransfer: {
    type: "startTransfer";
    id: string;
  };
  completeTransfer: {
    type: "completeTransfer";
    id: string;
  };
  transferError: {
    type: "transferError";
    id: string;
    error: string;
  };
  updateTransferProgress: {
    type: "updateTransferProgress";
    id: string;
    current: number;
    total: number;
    message: string;
  };
};

const store = createStore<Store, TransferEventMap>(
  {
    transfers: {},
  },
  {
    addTransfer: (context, event) => ({
      transfers: {
        ...context.transfers,
        [event.id]: {
          id: event.id,
          source: event.source,
          destination: event.destination,
          status: "idle" as const,
          createdAt: Date.now(),
        },
      },
    }),
    removeTransfer: (context, event) => {
      const { [event.id]: _, ...remainingTransfers } = context.transfers;
      return { transfers: remainingTransfers };
    },
    updateTransferSource: (context, event) => {
      const transfer = context.transfers[event.id];
      if (!transfer) return { transfers: context.transfers };
      return {
        transfers: {
          ...context.transfers,
          [event.id]: {
            ...transfer,
            source: {
              ...transfer.source,
              [event.field]: event.value,
            },
          },
        },
      };
    },
    updateTransferDestination: (context, event) => {
      const transfer = context.transfers[event.id];
      if (!transfer) return { transfers: context.transfers };
      return {
        transfers: {
          ...context.transfers,
          [event.id]: {
            ...transfer,
            destination: {
              ...transfer.destination,
              [event.field]: event.value,
            },
          },
        },
      };
    },
    startTransfer: (context, event) => {
      const transfer = context.transfers[event.id];
      if (!transfer) return { transfers: context.transfers };
      return {
        transfers: {
          ...context.transfers,
          [event.id]: {
            ...transfer,
            status: "syncing" as const,
          },
        },
      };
    },
    completeTransfer: (context, event) => {
      const transfer = context.transfers[event.id];
      if (!transfer) return { transfers: context.transfers };
      return {
        transfers: {
          ...context.transfers,
          [event.id]: {
            ...transfer,
            status: "completed" as const,
          },
        },
      };
    },
    transferError: (context, event) => {
      const transfer = context.transfers[event.id];
      if (!transfer) return { transfers: context.transfers };
      return {
        transfers: {
          ...context.transfers,
          [event.id]: {
            ...transfer,
            status: "error" as const,
            error: event.error,
          },
        },
      };
    },
    updateTransferProgress: (context, event) => {
      const transfer = context.transfers[event.id];
      if (!transfer) return { transfers: context.transfers };
      return {
        transfers: {
          ...context.transfers,
          [event.id]: {
            ...transfer,
            progress: {
              current: event.current,
              total: event.total,
              message: event.message,
            },
          },
        },
      };
    },
  }
);
