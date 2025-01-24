import { createStore } from "@xstate/store";

type Transfer = {
  host: string;
  user: string;
  password: string;
};

export type TransferStatus = "idle" | "syncing" | "completed" | "error";

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
  transfers: TransferState[];
  isDemoMode: boolean;
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
  };
};

export const store = createStore<Store, TransferEventMap>(
  {
    transfers: [
      {
        id: "demo1",
        source: {
          host: "imap.gmail.com",
          user: "user1@gmail.com",
          password: "password1",
        },
        destination: {
          host: "imap.outlook.com",
          user: "user1@outlook.com",
          password: "password2",
        },
        status: "idle",
        createdAt: Date.now(),
      },
      {
        id: "demo2",
        source: {
          host: "imap.yahoo.com",
          user: "user2@yahoo.com",
          password: "password3",
        },
        destination: {
          host: "imap.protonmail.com",
          user: "user2@protonmail.com",
          password: "password4",
        },
        status: "idle",
        createdAt: Date.now(),
      },
    ],
    isDemoMode: true,
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
        },
      ],
    }),
    startAll: (context) => {
      const idleTransfers = context.transfers.filter(
        (t) => t.status === "idle"
      );

      if (context.isDemoMode) {
        for (const transfer of idleTransfers) {
          let current = 0;
          const total = 100;
          const interval = setInterval(() => {
            current += Math.floor(Math.random() * 10) + 1;
            if (current >= total) {
              current = total;
              clearInterval(interval);
              store.send({ type: "completeTransfer", id: transfer.id });
            }
            store.send({
              type: "updateTransferProgress",
              id: transfer.id,
              current,
              total,
              message: `Simulating transfer: ${current}%`,
            });
          }, 500);
        }
      }

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
      if (!transfer) return context;

      if (context.isDemoMode) {
        let current = 0;
        const total = 100;
        const interval = setInterval(() => {
          current += Math.floor(Math.random() * 10) + 1;
          if (current >= total) {
            current = total;
            clearInterval(interval);
            store.send({ type: "completeTransfer", id: event.id });
          }
          store.send({
            type: "updateTransferProgress",
            id: event.id,
            current,
            total,
            message: `Simulating transfer: ${current}%`,
          });
        }, 500);
      }

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
              },
            }
          : transfer
      ),
    }),
  }
);
