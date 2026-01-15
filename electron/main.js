const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f0f1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: false,
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    let indexPath = path.join(__dirname, '../dist/part-manager/browser/index.html');
    
    if (!fs.existsSync(indexPath) && app.isPackaged) {
      indexPath = path.join(process.resourcesPath, 'dist/part-manager/browser/index.html');
    }
    
    if (!fs.existsSync(indexPath)) {
      indexPath = path.join(app.getAppPath(), 'dist/part-manager/browser/index.html');
    }
    
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

