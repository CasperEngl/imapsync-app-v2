import type { TransferState } from "./store.js";

interface TransferData {
  id: string;
  current: number;
  total: number;
  message: string;
  error?: string;
  progress: number;
}

export interface IpcApi {
  startAllTransfers: (transfers: TransferState[]) => void;
  startTransfer: (transfer: TransferState) => void;
  onTransferProgress: (
    callback: (event: unknown, data: TransferData) => void
  ) => void;
  onTransferComplete: (
    callback: (event: unknown, data: Pick<TransferData, "id">) => void
  ) => void;
  onTransferError: (
    callback: (event: unknown, data: Pick<TransferData, "id" | "error">) => void
  ) => void;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
