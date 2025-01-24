import { spawn } from "child_process";
import dayjs from "dayjs";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import Store from "electron-store";
import * as fs from "fs/promises";
import * as path from "path";
import type { TransferState } from "../src/renderer/store.js";
Store.initRenderer();

const store = new Store<{
  settings: {
    logDirectory?: string;
    imapsyncPath: string | null;
  };
}>({
  defaults: {
    settings: {
      logDirectory: null,
      imapsyncPath: null,
    },
  },
});

async function getLogDirectory(): Promise<string> {
  // @ts-expect-error Electron Store badly typed
  const storedPath = store.get("settings.logDirectory");
  if (storedPath) return storedPath;

  const defaultPath = path.join(app.getPath("userData"), "LOG_imapsync");
  const exists = await fs
    .access(defaultPath)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    await fs.mkdir(defaultPath, { recursive: true });
  }

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
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
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
  // @ts-expect-error Electron Store badly typed
  const storedPath = store.get("settings.imapsyncPath");

  if (storedPath) {
    return storedPath;
  }

  // Fall back to default location
  return path.join(getImapsyncBinaryDir(), "imapsync");
}

async function runImapsync(transfer: TransferState, win: BrowserWindow) {
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
      "--useheader",
      "Message-Id",
      "--logdir",
      logDir,
      "--logfile",
      `transfer_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}_${transfer.id}_${
        transfer.source.user
      }_to_${transfer.destination.user}.log`,
    ];

    const imapsync = spawn(imapsyncPath, args, {
      detached: true,
      stdio: "pipe",
    });

    // Define progress tracking variables outside the listener
    let totalProgress = 0;
    let messageCount = 0;
    let currentFolder = "";
    let currentStage = "Initializing";

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
        const folderMatch = line.match(/Host[12]: Folder \[(.*?)\]/);
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

        // Track total message count
        const totalMatch = line.match(
          /Host2: folder \[.*?\] has (\d+) messages/
        );
        if (totalMatch) {
          totalProgress = parseInt(totalMatch[1] ?? "0", 10);

          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: messageCount,
            total: totalProgress,
            message: `Found ${totalProgress} messages to transfer`,
            progress: 0,
          });
        }

        // Track individual message transfers
        if (line.includes("Message ID")) {
          messageCount++;

          if (totalProgress > 0) {
            const progress = Math.round((messageCount / totalProgress) * 100);
            win.webContents.send("transfer-progress", {
              id: transfer.id,
              current: messageCount,
              total: totalProgress,
              message: `Transferring emails (${currentFolder}): ${messageCount}/${totalProgress}`,
              progress: progress,
            });
          }
        }

        // Track connection stages
        if (line.includes("Connection on host1")) {
          currentStage = "Connecting to source server";
          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: 0,
            total: totalProgress,
            message: currentStage,
            progress: 0,
          });
        } else if (line.includes("Connection on host2")) {
          currentStage = "Connecting to destination server";
          win.webContents.send("transfer-progress", {
            id: transfer.id,
            current: 0,
            total: totalProgress,
            message: currentStage,
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

ipcMain.handle("start-all-transfers", async (event, transfers) => {
  for (const transfer of transfers) {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) {
        continue;
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
  }
});

ipcMain.handle("select-imapsync-binary", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Executables", extensions: ["*"] }],
    title: "Select imapsync binary",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  // Make it executable
  await fs.chmod(result.filePaths[0], "755");

  // @ts-expect-error Electron Store badly typed
  store.set("settings.imapsyncPath", result.filePaths[0]);

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

  // @ts-expect-error Electron Store badly typed
  store.set("settings.logDirectory", result.filePaths[0]);

  return result.filePaths[0];
});

ipcMain.handle("get-log-directory", async () => {
  return getLogDirectory();
});

ipcMain.handle("export-transfers", async (event, transfers) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: "Export Transfers",
      defaultPath: `transfers_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (!filePath) return { success: false };

    await fs.writeFile(filePath, JSON.stringify(transfers));

    return { success: true };
  } catch (error) {
    console.error("Failed to export transfers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
