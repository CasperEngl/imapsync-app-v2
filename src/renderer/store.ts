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
  error: string | null;
  progress?: TransferProgress;
  createdAt: number;
  outputs: TransferOutput[];
};

export interface StoreContext {
  transfers: TransferState[];
  settings: {
    showTransferIds: boolean;
    replaceAllOnImport: boolean;
  };
}

const STORAGE_KEY = "imapsync-store";

function loadPersistedState(): Partial<StoreContext> {
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

function persistState(state: StoreContext) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("[Store] Failed to persist state:", error);
  }
}

const persistedState = loadPersistedState();

const storeContext: StoreContext = {
  transfers: persistedState.transfers || [],
  settings: persistedState.settings || {
    showTransferIds: true,
    replaceAllOnImport: false,
  },
};

export const store = createStore({
  context: storeContext,
  on: {
    addTransfer: (
      context,
      event: {
        id: string;
        source: Transfer;
        destination: Transfer;
      }
    ) => ({
      transfers: [
        ...context.transfers,
        {
          id: event.id,
          source: event.source,
          destination: event.destination,
          status: "idle" as const,
          createdAt: Date.now(),
          outputs: [],
          error: null,
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
                error: null,
                outputs: [],
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
    removeTransfer: (
      context,
      event: {
        id: string;
      }
    ) => ({
      transfers: context.transfers.filter(
        (transfer) => transfer.id !== event.id
      ),
    }),
    updateTransferSource: (
      context,
      event: {
        id: string;
        field: keyof Transfer;
        value: string;
      }
    ) => ({
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
    updateTransferDestination: (
      context,
      event: {
        id: string;
        field: keyof Transfer;
        value: string;
      }
    ) => ({
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
    startTransfer: (
      context,
      event: {
        id: string;
      }
    ) => {
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
                error: null,
                outputs: [],
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
    completeTransfer: (
      context,
      event: {
        id: string;
      }
    ) => {
      return {
        transfers: context.transfers.map((transfer) =>
          transfer.id === event.id
            ? {
                ...transfer,
                status: "completed" as const,
              }
            : transfer
        ),
      };
    },
    transferError: (
      context,
      event: {
        id: string;
        error: string;
      }
    ) => ({
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
    updateTransferProgress: (
      context,
      event: {
        id: string;
        current: number;
        total: number;
        message: string;
        progress: number;
      }
    ) => ({
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
    addTransferOutput: (
      context,
      event: {
        id: string;
        content: string;
        isError: boolean;
        timestamp: number;
      }
    ) => ({
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
    duplicateTransfer: (
      context,
      event: {
        id: string;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (!transfer) return context;

      return {
        transfers: [
          ...context.transfers,
          {
            ...transfer,
            id: idGenerator(),
            status: "idle" as const,
            createdAt: Date.now(),
            outputs: [],
            error: null,
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
    toggleReplaceAllOnImport: (context) => ({
      ...context,
      settings: {
        ...context.settings,
        replaceAllOnImport: !context.settings.replaceAllOnImport,
      },
    }),
    removeAllByStatus: (context, event: { status: TransferStatus }) => ({
      ...context,
      transfers: context.transfers.filter(
        (transfer) => transfer.status !== event.status
      ),
    }),
    keepAllByStatus: (context, event: { status: TransferStatus }) => ({
      ...context,
      transfers: context.transfers.filter(
        (transfer) => transfer.status === event.status
      ),
    }),
    removeAll: (context) => ({
      ...context,
      transfers: [],
    }),
  },
});

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
