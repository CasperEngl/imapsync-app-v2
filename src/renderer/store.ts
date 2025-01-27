import { createStoreWithProducer } from "@xstate/store";
import { current, produce } from "immer";
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

export const store = createStoreWithProducer(produce, {
  context: storeContext,
  on: {
    addTransfer: (
      context,
      event: {
        id: string;
        source: Transfer;
        destination: Transfer;
      }
    ) => {
      context.transfers.push({
        id: event.id,
        source: event.source,
        destination: event.destination,
        status: "idle" as const,
        createdAt: Date.now(),
        outputs: [],
        error: null,
      });
    },
    startAll: (context) => {
      const idleTransfers = context.transfers
        .filter((t) => t.status === "idle")
        .map((transfer) => current(transfer));

      window.api.startAllTransfers(idleTransfers);

      for (const transfer of context.transfers) {
        if (transfer.status === "idle") {
          transfer.status = "syncing";
          transfer.error = null;
          transfer.outputs = [];
          transfer.progress = {
            current: 0,
            total: 100,
            message: "Starting transfer...",
            progress: 0,
          };
        }
      }
    },
    removeTransfer: (
      context,
      event: {
        id: string;
      }
    ) => {
      const index = context.transfers.findIndex((t) => t.id === event.id);
      if (index !== -1) {
        context.transfers.splice(index, 1);
      }
    },
    updateTransferSource: (
      context,
      event: {
        id: string;
        field: keyof Transfer;
        value: unknown;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);

      if (transfer && event.field in transfer.source) {
        transfer.source[event.field] = event.value as never;
      }
    },
    updateTransferDestination: (
      context,
      event: {
        id: string;
        field: keyof Transfer;
        value: unknown;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);

      if (transfer && event.field in transfer.destination) {
        transfer.destination[event.field] = event.value as never;
      }
    },
    startTransfer: (
      context,
      event: {
        id: string;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (!transfer) {
        console.warn("[Store] Transfer not found:", event.id);
        return;
      }

      console.log("transfer", transfer);
      window.api.startTransfer(current(transfer));

      transfer.status = "syncing";
      transfer.error = null;
      transfer.outputs = [];
      transfer.progress = {
        current: 0,
        total: 100,
        message: "Starting transfer...",
        progress: 0,
      };
    },
    completeTransfer: (
      context,
      event: {
        id: string;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (transfer) {
        transfer.status = "completed";
      }
    },
    transferError: (
      context,
      event: {
        id: string;
        error: string;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (transfer) {
        transfer.status = "error";
        transfer.error = event.error;
      }
    },
    updateTransferProgress: (
      context,
      event: {
        id: string;
        current: number;
        total: number;
        message: string;
        progress: number;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (transfer) {
        transfer.progress = {
          current: event.current,
          total: event.total,
          message: event.message,
          progress: event.progress,
        };
      }
    },
    addTransferOutput: (
      context,
      event: {
        id: string;
        content: string;
        isError: boolean;
        timestamp: number;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (transfer) {
        transfer.outputs.push({
          content: event.content,
          isError: event.isError,
          timestamp: Date.now(),
        });
      }
    },
    duplicateTransfer: (
      context,
      event: {
        id: string;
      }
    ) => {
      const transfer = context.transfers.find((t) => t.id === event.id);
      if (!transfer) return;

      context.transfers.push({
        source: transfer.source,
        destination: transfer.destination,
        id: idGenerator(),
        status: "idle" as const,
        createdAt: Date.now(),
        outputs: [],
        error: null,
        progress: undefined,
      });
    },
    toggleShowTransferIds: (context) => {
      context.settings.showTransferIds = !context.settings.showTransferIds;
    },
    toggleReplaceAllOnImport: (context) => {
      context.settings.replaceAllOnImport =
        !context.settings.replaceAllOnImport;
    },
    removeAllByStatus: (context, event: { status: TransferStatus }) => {
      context.transfers = context.transfers.filter(
        (transfer) => transfer.status !== event.status
      );
    },
    keepAllByStatus: (context, event: { status: TransferStatus }) => {
      context.transfers = context.transfers.filter(
        (transfer) => transfer.status === event.status
      );
    },
    removeAll: (context) => {
      context.transfers = [];
    },
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
