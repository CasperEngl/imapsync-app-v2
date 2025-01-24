import { contextBridge, ipcRenderer } from "electron";
import type { IpcApi } from "../src/renderer/types.d.ts";

contextBridge.exposeInMainWorld("api", {
  startTransfer: (transferData) => {
    return ipcRenderer.invoke("start-transfer", transferData);
  },
  startAllTransfers: (transfers) => {
    return ipcRenderer.invoke("start-all-transfers", transfers);
  },
  onTransferProgress: (callback) => {
    ipcRenderer.on("transfer-progress", callback);

    return () => {
      ipcRenderer.removeListener("transfer-progress", callback);
    };
  },
  onTransferComplete: (callback) => {
    ipcRenderer.on("transfer-complete", callback);

    return () => {
      ipcRenderer.removeListener("transfer-complete", callback);
    };
  },
  onTransferError: (callback) => {
    ipcRenderer.on("transfer-error", callback);

    return () => {
      ipcRenderer.removeListener("transfer-error", callback);
    };
  },
} satisfies IpcApi);
