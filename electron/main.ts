import { spawn } from "child_process";
import { app, BrowserWindow, ipcMain } from "electron";
import fs from "fs";
import path from "path";
import type { TransferState } from "../src/renderer/store.js";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.cjs"),
    },
  });

  if (process.env.NODE_ENV !== "production") {
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

function getImapsyncPath(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const resourcesPath = isDev
    ? path.join(process.cwd(), "resources")
    : process.resourcesPath;

  return path.join(resourcesPath, "bin", "imapsync");

  switch (process.platform) {
    case "win32":
      return path.join(resourcesPath, "bin", "imapsync.exe");
    case "darwin":
      return path.join(resourcesPath, "bin", "imapsync-mac");
    default: // linux
      return path.join(resourcesPath, "bin", "imapsync-linux");
  }
}

function runImapsync(transfer: TransferState, win: BrowserWindow) {
  return new Promise((resolve, reject) => {
    const imapsyncPath = getImapsyncPath();

    if (!fs.existsSync(imapsyncPath)) {
      reject(new Error(`imapsync binary not found at ${imapsyncPath}`));
      return;
    }

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
      "--skipsize",
      "--addheader",
      "X-IMAPSYNC-ID: " + transfer.id,
    ];

    const imapsync = spawn(imapsyncPath, args, {
      detached: true,
      stdio: "pipe",
    });

    // Define progress tracking variables outside the listener
    let totalProgress = 0;
    let messageCount = 0;
    let currentFolder = "";
    let currentMessage = "";
    let currentStage = "Initializing";

    imapsync.stdout.setEncoding("utf8");

    imapsync.stdout.on("data", (data) => {
      let output = data.toString();

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
          const messageIdMatch = line.match(/Message ID (\S+)/);
          currentMessage = messageIdMatch ? messageIdMatch[1] : "";

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
      // Keep stderr handling but remove logging
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
