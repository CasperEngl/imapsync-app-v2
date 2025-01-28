import type { IpcApi } from "../ipc.ts";

declare global {
  interface Window {
    api: IpcApi;
  }
}
