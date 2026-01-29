const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  updateNotificationTracker: (trackerId) => ipcRenderer.invoke('update-notification-tracker', trackerId),
  sendNotification: (payload) => ipcRenderer.invoke('send-notification', payload),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
});
