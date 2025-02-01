import type { TransferWithState } from "~/renderer/schemas.js";

interface TransferData {
  id: string;
  current: number;
  total: number;
  message: string;
  error?: string;
  progress: number;
}

interface TransferOutputData {
  id: string;
  content: string;
  isError: boolean;
  timestamp: number;
}

export interface IpcApi {
  startAllTransfers: (transfers: TransferWithState[]) => void;
  startTransfer: (transfer: TransferWithState) => void;
  onTransferProgress: (
    callback: (event: unknown, data: TransferData) => void
  ) => void;
  onTransferComplete: (
    callback: (event: unknown, data: Pick<TransferData, "id">) => void
  ) => void;
  onTransferError: (
    callback: (event: unknown, data: Pick<TransferData, "id" | "error">) => void
  ) => void;
  onTransferOutput: (
    callback: (event: unknown, data: TransferOutputData) => void
  ) => void;
  selectImapsyncBinary: () => Promise<string>;
  getImapsyncPath: () => Promise<string>;
  selectLogDirectory: () => Promise<string>;
  getLogDirectory: () => Promise<string>;
  getConcurrentTransfers: () => Promise<number>;
  setConcurrentTransfers: (value: number) => Promise<number>;
  exportTransfers: (
    transfers: TransferWithState[],
    options: {
      exportAs: "json" | "csv";
      withState: boolean;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  openExternalUrl: (url: string) => Promise<void>;
  removeTransfer: (transferId: string) => Promise<void>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
