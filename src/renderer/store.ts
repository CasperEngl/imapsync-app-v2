import { createStore } from "@xstate/store";
import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const idLength = 10;
export const idGenerator = customAlphabet(alphabet, idLength);

export type Transfer = {
  host: string;
  user: string;
  password: string;
  port?: string;
  ssl?: boolean;
  tls?: boolean;
};

export type TransferStatus = "idle" | "syncing" | "completed" | "error";

type TransferProgress = {
  current: number;
  total: number;
  message: string;
  progress: number;
};

type TransferOutput = {
  content: string;
  isError: boolean;
  timestamp: number;
};

export type TransferState = {
  id: string;
  source: Transfer;
  destination: Transfer;
  status: TransferStatus;
  error?: string;
  progress?: TransferProgress;
  createdAt: number;
  outputs: TransferOutput[];
};

export interface Store {
  transfers: TransferState[];
  settings: {
    showTransferIds: boolean;
  };
}

type TransferEventMap = {
  addTransfer: {
    type: "addTransfer";
    id: string;
    source: Transfer;
    destination: Transfer;
  };
  startAll: {
    type: "startAll";
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
    progress: number;
  };
  addTransferOutput: {
    type: "addTransferOutput";
    id: string;
    content: string;
    isError: boolean;
    timestamp: number;
  };
  duplicateTransfer: {
    type: "duplicateTransfer";
    id: string;
  };
  toggleShowTransferIds: {
    type: "toggleShowTransferIds";
  };
  removeAllCompleted: {
    type: "removeAllCompleted";
  };
};

const STORAGE_KEY = "imapsync-store";

function loadPersistedState(): Partial<Store> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("[Store] Failed to load persisted state:", error);
  }
  return {};
}

function persistState(state: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("[Store] Failed to persist state:", error);
  }
}

export const store = createStore<Store, TransferEventMap>(
  {
    transfers: loadPersistedState().transfers || [],
    settings: loadPersistedState().settings || {
      showTransferIds: true,
    },
  },
  {
    addTransfer: (context, event) => ({
      transfers: [
        ...context.transfers,
        {
          id: event.id,
          source: event.source,
          destination: event.destination,
          status: "idle" as const,
          createdAt: Date.now(),
          outputs: [],
        },
      ],
    }),
    startAll: (context) => {
      const idleTransfers = context.transfers.filter(
        (t) => t.status === "idle"
      );

      window.api.startAllTransfers(idleTransfers);

      return {
        ...context,
        transfers: context.transfers.map((transfer) =>
          transfer.status === "idle"
            ? {
                ...transfer,
                status: "syncing" as const,
                progress: {
                  current: 0,
                  total: 100,
                  message: "Starting transfer...",
                  progress: 0,
                },
              }
            : transfer
        ),
      };
    },
    removeTransfer: (context, event) => ({
      transfers: context.transfers.filter(
        (transfer) => transfer.id !== event.id
      ),
    }),
    updateTransferSource: (context, event) => ({
      transfers: context.transfers.map((transfer) =>
        transfer.id === event.id
          ? {
              ...transfer,
              source: {
                ...transfer.source,
                [event.field]: event.value,
              },
            }
          : transfer
      ),
    }),
    updateTransferDestination: (context, event) => ({
      transfers: context.transfers.map((transfer) =>
        transfer.id === event.id
          ? {
              ...transfer,
              destination: {
                ...transfer.destination,
                [event.field]: event.value,
              },
            }
          : transfer
      ),
    }),
    startTransfer: (context, event) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (!transfer) {
        console.warn("[Store] Transfer not found:", event.id);
        return context;
      }

      window.api.startTransfer(transfer);

      return {
        ...context,
        transfers: context.transfers.map((transfer) =>
          transfer.id === event.id
            ? {
                ...transfer,
                status: "syncing" as const,
                progress: {
                  current: 0,
                  total: 100,
                  message: "Starting transfer...",
                  progress: 0,
                },
              }
            : transfer
        ),
      };
    },
    completeTransfer: (context, event) => ({
      transfers: context.transfers.map((transfer) =>
        transfer.id === event.id
          ? {
              ...transfer,
              status: "completed" as const,
            }
          : transfer
      ),
    }),
    transferError: (context, event) => ({
      transfers: context.transfers.map((transfer) =>
        transfer.id === event.id
          ? {
              ...transfer,
              status: "error" as const,
              error: event.error,
            }
          : transfer
      ),
    }),
    updateTransferProgress: (context, event) => ({
      transfers: context.transfers.map((transfer) =>
        transfer.id === event.id
          ? {
              ...transfer,
              progress: {
                current: event.current,
                total: event.total,
                message: event.message,
                progress: event.progress,
              },
            }
          : transfer
      ),
    }),
    addTransferOutput: (context, event) => ({
      ...context,
      transfers: context.transfers.map((transfer) =>
        transfer.id === event.id
          ? {
              ...transfer,
              outputs: [
                ...transfer.outputs,
                {
                  content: event.content,
                  isError: event.isError,
                  timestamp: Date.now(),
                },
              ],
            }
          : transfer
      ),
    }),
    duplicateTransfer: (context, event) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (!transfer) return context;

      return {
        transfers: [
          ...context.transfers,
          {
            ...transfer,
            id: idGenerator(),
            status: "idle",
            createdAt: Date.now(),
            outputs: [],
            error: undefined,
            progress: undefined,
          },
        ],
      };
    },
    toggleShowTransferIds: (context) => ({
      ...context,
      settings: {
        ...context.settings,
        showTransferIds: !context.settings.showTransferIds,
      },
    }),
    removeAllCompleted: (context) => ({
      ...context,
      transfers: context.transfers.filter(
        (transfer) => transfer.status !== "completed"
      ),
    }),
  }
);

// Add subscription to persist state changes
store.subscribe((state) => {
  persistState(state.context);
});

// Setup IPC listeners
window.api.onTransferProgress((event, data) => {
  store.send({
    type: "updateTransferProgress",
    id: data.id,
    current: data.current,
    total: data.total,
    message: data.message,
    progress: data.progress,
  });
});

window.api.onTransferComplete((event, data) => {
  store.send({
    type: "completeTransfer",
    id: data.id,
  });
});

window.api.onTransferError((event, data) => {
  console.error("[Store] Transfer error:", data);
  store.send({
    type: "transferError",
    id: data.id,
    error: data.error || "Unknown error",
  });
});

window.api.onTransferOutput((event, data) => {
  store.send({
    type: "addTransferOutput",
    id: data.id,
    content: data.content,
    isError: data.isError,
    timestamp: data.timestamp,
  });
});
