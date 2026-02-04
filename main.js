const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");

let mainWindow;
let tray;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
      if (process.platform === "darwin") {
        app.dock.show();
      }
    }
  });

  // Continue with app initialization only if we got the lock
  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
        if (process.platform === "darwin") {
          app.dock.show();
        }
      }
    });
  });
}

function createWindow() {
  // In production, icons are in app.asar.unpacked, in dev they're in public folder
  const iconPath = isDev 
    ? path.join(__dirname, "public/icons/icon.png")
    : path.join(process.resourcesPath, "app.asar.unpacked/public/icons/icon.png");
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    title: "Task Tracker",
    icon: iconPath,
    frame: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 14 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  
  // Show window once content is ready
  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "out/index.html"));
  }

  // Hide to tray instead of closing
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (process.platform === "darwin") {
        app.dock.hide();
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  // Get the correct icon path for both dev and production
  const iconPath = isDev
    ? path.join(__dirname, "public/icons/tray-icon.png")
    : path.join(process.resourcesPath, "app.asar.unpacked/public/icons/tray-icon.png");
  
  // Create native image for better cross-platform support
  const icon = nativeImage.createFromPath(iconPath);
  
  // Resize for macOS tray (16x16 or 32x32)
  if (process.platform === "darwin") {
    icon.setTemplateImage(true);
  }
  
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Task Tracker",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (process.platform === "darwin") {
            app.dock.show(); // Show in dock on macOS
          }
        } else {
          createWindow();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Task Tracker");
  tray.setContextMenu(contextMenu);
  
  // Show window on tray icon click (especially useful on Windows/Linux)
  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        if (process.platform === "darwin") {
          app.dock.show();
        }
      }
    } else {
      createWindow();
    }
  });
}

// IPC Handlers for window controls
ipcMain.handle("window-minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("window-close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle("show-notification", (_event, payload) => {
  const notification = new Notification({
    title: payload?.title ?? "Task Reminder",
    body: payload?.body ?? "You have pending tasks today.",
    timeoutType: "never",
    silent: false,
  });

  notification.show();
});