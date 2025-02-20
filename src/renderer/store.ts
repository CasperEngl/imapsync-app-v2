import { createStoreWithProducer } from "@xstate/store";
import { current, produce } from "immer";

import type {
  Transfer,
  TransferEndpoint,
  TransferProgress,
  TransferState,
  TransferStatus,
  TransferWithState,
} from "~/renderer/schemas.js";

import { loadPersistedState, persistState } from "~/renderer/persist-state.js";
import { idGenerator } from "~/renderer/utils/id.js";

export interface StoreContext {
  transfers: TransferWithState[];
  settings: {
    showTransferIds: boolean;
    replaceAllOnImport: boolean;
    exportWithState: boolean;
  };
}

const persistedState = loadPersistedState();

const storeContext: StoreContext = {
  transfers:
    persistedState.transfers?.map(transfer => ({
      ...transfer,
      status: transfer.status === "syncing" ? "idle" : transfer.status,
    })) ?? [],
  settings: persistedState.settings ?? {
    showTransferIds: true,
    replaceAllOnImport: false,
    exportWithState: true,
  },
};

export const store = createStoreWithProducer(produce, {
  context: storeContext,
  on: {
    addTransfer: (context, event: Partial<TransferState> & Transfer) => {
      context.transfers.push({
        id: event.id,
        source: event.source,
        destination: event.destination,
        status: event.status || ("idle" as const),
        createdAt: event.createdAt || Date.now(),
        outputs: event.outputs || "",
        error: event.error || null,
        progress: event.progress,
      });
    },
    startAll: (context) => {
      const idleTransfers = context.transfers
        .filter(transfer => transfer.status === "idle")
        .map(transfer => current(transfer));

      window.api.startAllTransfers(idleTransfers);

      for (const transfer of context.transfers) {
        if (transfer.status === "idle") {
          transfer.status = "syncing";
          transfer.error = null;
          transfer.outputs = "";
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
      },
    ) => {
      const index = context.transfers.findIndex(
        transfer => transfer.id === event.id,
      );
      if (index !== -1) {
        context.transfers.splice(index, 1);
      }

      void window.api.removeTransfer(event.id);
    },
    updateTransferSource: (
      context,
      event: {
        id: string;
        field: keyof TransferEndpoint;
        value: unknown;
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );

      if (transfer && event.field in transfer.source) {
        transfer.source[event.field] = event.value as never;
      }
    },
    updateTransferDestination: (
      context,
      event: {
        id: string;
        field: keyof TransferEndpoint;
        value: unknown;
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );

      if (transfer && event.field in transfer.destination) {
        transfer.destination[event.field] = event.value as never;
      }
    },
    startTransfer: (
      context,
      event: {
        id: string;
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );
      if (!transfer) {
        console.warn("[Store] Transfer not found:", event.id);

        return;
      }

      window.api.startTransfer(current(transfer));

      transfer.status = "syncing";
      transfer.error = null;
      transfer.outputs = "";
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
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );
      if (transfer) {
        transfer.status = "completed";
      }
    },
    transferError: (
      context,
      event: {
        id: string;
        error: string;
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );
      if (transfer) {
        transfer.status = "error";
        transfer.error = event.error;
      }
    },
    updateTransferProgress: (
      context,
      event: TransferProgress & {
        id: string;
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );
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
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );
      if (transfer) {
        transfer.outputs += event.content;
      }
    },
    duplicateTransfer: (
      context,
      event: {
        id: string;
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );
      if (!transfer) return;

      context.transfers.push({
        source: transfer.source,
        destination: transfer.destination,
        id: idGenerator(),
        status: "idle" as const,
        createdAt: Date.now(),
        outputs: "",
        error: null,
        progress: undefined,
      });
    },
    swapSourceAndDestination: (
      context,
      event: {
        id: string;
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );
      if (!transfer) return;

      const source = current(transfer.source);
      const destination = current(transfer.destination);

      transfer.source = destination;
      transfer.destination = source;
    },
    toggleShowTransferIds: (context) => {
      context.settings.showTransferIds = !context.settings.showTransferIds;
    },
    toggleReplaceAllOnImport: (context) => {
      context.settings.replaceAllOnImport
        = !context.settings.replaceAllOnImport;
    },
    toggleExportWithState: (context) => {
      context.settings.exportWithState = !context.settings.exportWithState;
    },
    removeAllByStatus: (context, event: { status: TransferStatus }) => {
      context.transfers = context.transfers.filter(
        transfer => transfer.status !== event.status,
      );
    },
    keepAllByStatus: (context, event: { status: TransferStatus }) => {
      context.transfers = context.transfers.filter(
        transfer => transfer.status === event.status,
      );
    },
    removeAll: (context) => {
      context.transfers = [];
    },
    stopTransfer: (
      context,
      event: {
        id: string;
      },
    ) => {
      const transfer = context.transfers.find(
        transfer => transfer.id === event.id,
      );
      if (transfer) {
        transfer.status = "idle";
        if (transfer.progress) {
          transfer.progress.message
            = "Transfer stopped by user. Sync is incomplete.";
        }
      }
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
  });
});

// Add the stop transfer listener
window.api.onTransferStop((event, data) => {
  store.send({
    type: "stopTransfer",
    id: data.id,
  });
});
