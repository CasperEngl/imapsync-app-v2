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
  onTransferOutput: (callback) => {
    ipcRenderer.on("transfer-output", callback);

    return () => {
      ipcRenderer.removeListener("transfer-output", callback);
    };
  },
  selectImapsyncBinary: () => ipcRenderer.invoke("select-imapsync-binary"),
  getImapsyncPath: () => ipcRenderer.invoke("get-imapsync-path"),
  selectLogDirectory: () => ipcRenderer.invoke("select-log-directory"),
  getLogDirectory: () => ipcRenderer.invoke("get-log-directory"),
  getConcurrentTransfers: () => ipcRenderer.invoke("get-concurrent-transfers"),
  setConcurrentTransfers: (value: number) =>
    ipcRenderer.invoke("set-concurrent-transfers", value),
  exportTransfers: (transfers, options) =>
    ipcRenderer.invoke("export-transfers", transfers, options),
  openExternalUrl: (url: string) =>
    ipcRenderer.invoke("open-external-url", url),
  removeTransfer: (transferId: string) =>
    ipcRenderer.invoke("remove-transfer", transferId),
  stopTransfer: (transferId) => {
    return ipcRenderer.invoke("stop-transfer", transferId);
  },
  onTransferStop: (callback) => {
    ipcRenderer.on("transfer-stop", callback);

    return () => {
      ipcRenderer.removeListener("transfer-stop", callback);
    };
  },
} satisfies IpcApi);
