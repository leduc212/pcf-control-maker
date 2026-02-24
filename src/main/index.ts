import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { registerProjectHandlers } from './ipc/project.ipc';
import { registerPacCliHandlers } from './ipc/pac-cli.ipc';
import { registerFileSystemHandlers } from './ipc/file-system.ipc';
import { registerSolutionHandlers } from './ipc/solution.ipc';
import { registerSettingsHandlers } from './ipc/settings.ipc';
import { registerEnvironmentHandlers } from './ipc/environment.ipc';
import { registerTemplateHandlers } from './ipc/template.ipc';
import { registerLocalizationHandlers } from './ipc/localization.ipc';
import { registerGitHandlers } from './ipc/git.ipc';
import { registerToolsHandlers } from './ipc/tools.ipc';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'PCF Maker',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    show: false,
    backgroundColor: '#f5f5f5',
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register all IPC handlers
function registerIpcHandlers(): void {
  registerProjectHandlers(ipcMain);
  registerPacCliHandlers(ipcMain);
  registerFileSystemHandlers(ipcMain);
  registerSolutionHandlers(ipcMain);
  registerSettingsHandlers(ipcMain);
  registerEnvironmentHandlers(ipcMain);
  registerTemplateHandlers(ipcMain);
  registerLocalizationHandlers(ipcMain);
  registerGitHandlers(ipcMain);
  registerToolsHandlers(ipcMain);
}

// App lifecycle
app.whenReady().then(() => {
  registerIpcHandlers();
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
