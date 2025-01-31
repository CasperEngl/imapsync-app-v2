import { app, BrowserWindow, shell } from "electron";
import { join } from "path";

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

// Register custom protocol
if (process.defaultApp) {
  if (process.argv.length >= 2 && process.argv[1]) {
    app.setAsDefaultProtocolClient('imapsync-app', process.execPath, [
      join(__dirname, process.argv[1])
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('imapsync-app');
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the app
  if (process.env.NODE_ENV === "development") {
    await mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow OAuth provider URLs to open in the default browser
    if (url.startsWith('http://localhost:3001')) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
}

// Handle the protocol. In this case, we choose to show an Error Box.
app.on('open-url', (event, url) => {
  event.preventDefault();
  
  const callbackUrl = new URL(url.replace('imapsync-app://', 'http://'));
  const code = callbackUrl.searchParams.get('code');
  
  if (mainWindow && code) {
    const redirectUrl = process.env.NODE_ENV === "development" 
      ? `http://localhost:5173/callback?code=${code}`
      : `file://${join(__dirname, "../renderer/index.html")}?code=${code}`;
      
    mainWindow.loadURL(redirectUrl);
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle second instance
app.on('second-instance', (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    // Handle protocol url from second instance
    const url = commandLine.find(arg => arg.startsWith('imapsync-app://'));
    if (url) {
      const callbackUrl = new URL(url.replace('imapsync-app://', 'http://'));
      const code = callbackUrl.searchParams.get('code');
      
      if (code) {
        const redirectUrl = process.env.NODE_ENV === "development" 
          ? `http://localhost:5173/callback?code=${code}`
          : `file://${join(__dirname, "../renderer/index.html")}?code=${code}`;
          
        mainWindow.loadURL(redirectUrl);
      }
    }
  }
}); 