const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    title: "Task Tracker",
    icon: path.join(__dirname, "public/icons/icon.png"),
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
  tray = new Tray(path.join(__dirname, "public/icons/tray-icon.png"));
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

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  });
});

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