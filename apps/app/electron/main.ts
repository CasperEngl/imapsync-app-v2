import dayjs from "dayjs";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import Store from "electron-store";
import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import path from "node:path";

import type {
  TransferState,
  TransferWithState,
} from "../src/renderer/schemas.js";

Store.initRenderer();

// Track all running processes
const runningProcesses = new Map<string, ReturnType<typeof spawn>>();

// Add cleanup handler for app quit
app.on("before-quit", () => {
  // Gracefully terminate all running processes
  for (const [id, process] of runningProcesses.entries()) {
    try {
      process.kill();
      runningProcesses.delete(id);
      // Notify renderer that transfer is no longer running
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send("transfer-error", {
          id,
          error: "Transfer stopped due to application quit",
        });
      });
    } catch (error) {
      console.error(`Failed to kill process ${id}:`, error);
    }
  }
});

const store = new Store<{
  logDirectory: string | null;
  imapsyncPath: string | null;
  concurrentTransfers: number;
}>({
  defaults: {
    logDirectory: null,
    imapsyncPath: null,
    concurrentTransfers: 3,
  },
});

async function getLogDirectory(): Promise<string> {
  const defaultPath = path.join(app.getPath("userData"), "LOG_imapsync");
  const storedPath = store.get("logDirectory");

  const exists = await fs
    .access(defaultPath ?? storedPath)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    await fs.mkdir(defaultPath ?? storedPath, {
      recursive: true,
    });
  }

  if (storedPath) return storedPath;

  return defaultPath;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      devTools: !app.isPackaged,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.mjs"),
    },
  });

  if (!app.isPackaged) {
    await win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({
      mode: "bottom",
    });
  } else {
    await win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

void app.whenReady().then(() => {
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Clean up any running processes when all windows are closed
  for (const [id, process] of runningProcesses.entries()) {
    try {
      process.kill();
      runningProcesses.delete(id);
    } catch (error) {
      console.error(`Failed to kill process ${id}:`, error);
    }
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

function getImapsyncBinaryDir(): string {
  return !app.isPackaged
    ? path.join(process.cwd(), "resources", "bin")
    : path.join(process.resourcesPath, "bin");
}

function getImapsyncPath(): string {
  const storedPath = store.get("imapsyncPath", "");

  if (storedPath) {
    return storedPath;
  }

  // Fall back to default location
  return path.join(getImapsyncBinaryDir(), "imapsync");
}

async function runImapsync(transfer: TransferWithState, win: BrowserWindow) {
  const imapsyncPath = getImapsyncPath();
  const logDir = await getLogDirectory();

  try {
    await fs.access(imapsyncPath);
  } catch {
    throw new Error(`imapsync binary not found at ${imapsyncPath}`);
  }

  return new Promise((resolve, reject) => {
    const args = [
      "--host1",
      transfer.source.host,
      "--user1",
      transfer.source.user,
      "--password1",
      transfer.source.password,
      "--host2",
      transfer.destination.host,
      "--user2",
      transfer.destination.user,
      "--password2",
      transfer.destination.password,
      "--logdir",
      logDir,
      "--logfile",
      `transfer_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}_${transfer.id}_${
        transfer.source.user
      }_to_${transfer.destination.user}.log`,
    ];

    const imapsync = spawn(imapsyncPath, args, {
      detached: false, // Change to false since we're managing the process lifecycle
      stdio: "pipe",
    });

    // Track the process
    runningProcesses.set(transfer.id, imapsync);

    // Define progress tracking variables outside the listener
    let totalProgress = 0;
    let messageCount = 0;
    let currentFolder = "";

    imapsync.stdout.setEncoding("utf8");

    imapsync.stdout.on("data", (data) => {
      let output = data.toString();

      // Send raw output to frontend
      win.webContents.send("transfer-output", {
        id: transfer.id,
        content: output,
        isError: false,
        timestamp: Date.now(),
      });

      while (true) {
        const newlineIndex = output.indexOf("\n");
        if (newlineIndex === -1) break;

        const line = output.slice(0, newlineIndex);
        output = output.slice(newlineIndex + 1);

        // Track folder changes
        const folderMatch = line.match(/Host\d: Folder \[(.*?)\]/);
        if (folderMatch) {
          currentFolder = folderMatch[1];
          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: messageCount,
            total: totalProgress,
            message: `Processing folder: ${currentFolder}`,
            progress:
              totalProgress > 0
                ? Math.round((messageCount / totalProgress) * 100)
                : 0,
          });
        }

        // Track total folders
        const folderCountMatch = line.match(/Host1 Nb folders:\s+(\d+) folders/);
        if (folderCountMatch) {
          const totalFolders = Number.parseInt(folderCountMatch[1], 10);
          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: 0,
            total: totalFolders,
            message: `Found ${totalFolders} folders to process`,
            progress: 0,
          });
        }

        // Track total messages
        const messageCountMatch = line.match(/Host1 Nb messages:\s+(\d+) messages/);
        if (messageCountMatch) {
          const totalMessages = Number.parseInt(messageCountMatch[1], 10);
          totalProgress = totalMessages; // Update the existing totalProgress variable
          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: 0,
            total: totalMessages,
            message: `Found ${totalMessages} messages to transfer`,
            progress: 0,
          });
        }

        // Track individual message transfers
        const messageProgressMatch = line.match(/(\d+)\/(\d+) msgs left/);
        if (messageProgressMatch) {
          const [, remainingStr, totalStr] = messageProgressMatch;
          const remaining = Number.parseInt(remainingStr, 10);
          const total = Number.parseInt(totalStr, 10);
          messageCount = total - remaining;
          totalProgress = total;

          if (totalProgress > 0) {
            const progress = Math.round((messageCount / totalProgress) * 100);
            win.webContents.send("transfer-progress", {
              id: transfer.id,
              current: messageCount,
              total: totalProgress,
              message: currentFolder
                ? `Transferring emails (${currentFolder}): ${messageCount} / ${totalProgress}`
                : `Transferring emails: ${messageCount} / ${totalProgress}`,
              progress,
            });
          }
        }

        // Track connection stages
        if (line.includes("Connection on host1")) {
          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: 0,
            total: totalProgress,
            message: "Connecting to source server",
            progress: 0,
          });
        } else if (line.includes("Connection on host2")) {
          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: 0,
            total: totalProgress,
            message: "Connecting to destination server",
            progress: 0,
          });
        }

        // Track completion
        if (line.includes("Transfer ended on")) {
          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: totalProgress,
            total: totalProgress,
            message: "Transfer complete",
            progress: 100,
          });
        }
      }
    });

    imapsync.stderr.on("data", (data) => {
      // Send stderr output to frontend as well
      win.webContents.send("transfer-output", {
        id: transfer.id,
        content: data.toString(),
        isError: true,
        timestamp: Date.now(),
      });
    });

    imapsync.on("error", (error) => {
      reject(new Error(`Failed to start imapsync: ${error.message}`));
    });

    imapsync.on("close", (code) => {
      // Remove from tracking on process end
      runningProcesses.delete(transfer.id);
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`imapsync process exited with code ${code}`));
      }
    });
  });
}

ipcMain.handle("start-transfer", async (event, transfer) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      throw new Error("No window found for transfer");
    }

    await runImapsync(transfer, win);

    win.webContents.send("transfer-complete", {
      id: transfer.id,
    });
  } catch (error) {
    event.sender.send("transfer-error", {
      id: transfer.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

async function asyncPool<T, U>(
  concurrency: number,
  items: T[],
  fn: (item: T) => Promise<U>,
): Promise<U[]> {
  const results: U[] = [];
  const inProgress = new Set<Promise<void>>();

  return new Promise((resolve, reject) => {
    let index = 0;

    function next() {
      if (index === items.length && inProgress.size === 0) {
        resolve(results);

        return;
      }

      while (inProgress.size < concurrency && index < items.length) {
        const item = items[index++];
        const promise = fn(item)
          .then((result) => {
            results.push(result);
            inProgress.delete(promise);
            next();
          })
          .catch((err) => {
            reject(err);
          });

        inProgress.add(promise);
      }
    }

    next();
  });
}

ipcMain.handle("start-all-transfers", async (event, transfers: TransferWithState[]) => {
  const CONCURRENT_TRANSFERS = store.get("concurrentTransfers", 3);

  await asyncPool(
    CONCURRENT_TRANSFERS,
    transfers,
    async (transfer) => {
      try {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) {
          throw new Error("No window found for transfer");
        }

        await runImapsync(transfer, win);

        win.webContents.send("transfer-complete", {
          id: transfer.id,
        });
      } catch (error) {
        event.sender.send("transfer-error", {
          id: transfer.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );
});

ipcMain.handle("select-imapsync-binary", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Executables", extensions: ["*"] }],
    title: "Select imapsync binary",
  });

  if (result.canceled || !result.filePaths[0]) {
    return null;
  }

  // Make it executable
  await fs.chmod(result.filePaths[0], "755");

  store.set("imapsyncPath", result.filePaths[0]);

  return result.filePaths[0];
});

// Add a handler to get the current path
ipcMain.handle("get-imapsync-path", () => {
  return getImapsyncPath();
});

ipcMain.handle("select-log-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "Select log directory",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  store.set("logDirectory", result.filePaths[0]);

  return result.filePaths[0];
});

ipcMain.handle("get-log-directory", async () => {
  return getLogDirectory();
});

ipcMain.handle(
  "export-transfers",
  async (
    event,
    transfers: TransferWithState[],
    options: { exportAs: "json" | "csv"; withState: boolean },
  ) => {
    try {
      const { exportAs, withState } = options;

      const { filePath } = await dialog.showSaveDialog({
        title: "Export Transfers",
        defaultPath: `transfers_${dayjs().format(
          "YYYY-MM-DD_HH-mm-ss",
        )}.${exportAs}`,
        filters: [{ name: exportAs.toUpperCase(), extensions: [exportAs] }],
      });

      if (!filePath) return { success: false };

      if (exportAs === "json") {
        // If withState is false, strip out the state properties
        const dataToExport = withState
          ? transfers
          : transfers.map(({ source, destination }) => ({
              source,
              destination,
            }));
        await fs.writeFile(filePath, JSON.stringify(dataToExport, null, 2));
      } else {
        // Convert transfers to CSV format
        const headers = [
          "Source Host",
          "Source User",
          "Source Password",
          "Destination Host",
          "Destination User",
          "Destination Password",
          ...(withState ? ["State"] : []),
        ];
        const rows = transfers.map(transfer => [
          transfer.source.host,
          transfer.source.user,
          transfer.source.password,
          transfer.destination.host,
          transfer.destination.user,
          transfer.destination.password,
          ...(withState
            ? [
                JSON.stringify({
                  id: transfer.id,
                  status: transfer.status,
                  error: transfer.error,
                  progress: transfer.progress,
                  createdAt: transfer.createdAt,
                  outputs: transfer.outputs,
                } satisfies TransferState),
              ]
            : []),
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, "\"\"")}"`).join(","),
          ),
        ].join("\n");

        await fs.writeFile(filePath, csvContent);
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to export transfers:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// Add this with the other ipcMain handlers
ipcMain.handle("open-external-url", async (_, url: string) => {
  return shell.openExternal(url);
});

// Add handler for removing transfers
ipcMain.handle("remove-transfer", async (_, transferId: string) => {
  const process = runningProcesses.get(transferId);
  if (process) {
    try {
      process.kill();
    } catch (error) {
      console.error(`Failed to kill process for transfer ${transferId}:`, error);
    }
  }
  runningProcesses.delete(transferId);
});

// Add handlers for concurrent transfers setting
ipcMain.handle("get-concurrent-transfers", () => {
  return store.get("concurrentTransfers");
});

ipcMain.handle("set-concurrent-transfers", (_, value: number) => {
  if (value < 1) {
    throw new Error("Concurrent transfers must be a positive number");
  }
  store.set("concurrentTransfers", value);
  return value;
});
