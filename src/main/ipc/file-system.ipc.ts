import { IpcMain, dialog, shell } from 'electron';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export function registerFileSystemHandlers(ipcMain: IpcMain): void {
  // Read file
  ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Write file
  ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Check if path exists
  ipcMain.handle('fs:exists', async (_event, targetPath: string) => {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  });

  // Read directory
  ipcMain.handle('fs:read-dir', async (_event, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return {
        success: true,
        entries: entries.map(entry => ({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          path: path.join(dirPath, entry.name),
        })),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Create directory
  ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Open in file explorer
  ipcMain.handle('fs:open-in-explorer', async (_event, targetPath: string) => {
    shell.showItemInFolder(targetPath);
    return { success: true };
  });

  // Open external URL
  ipcMain.handle('fs:open-external', async (_event, url: string) => {
    await shell.openExternal(url);
    return { success: true };
  });

  // Save file dialog
  ipcMain.handle('fs:save-dialog', async (_event, options: Electron.SaveDialogOptions) => {
    const result = await dialog.showSaveDialog(options);
    if (result.canceled) {
      return null;
    }
    return result.filePath;
  });

  // Open in code editor (VS Code by default)
  ipcMain.handle('fs:open-in-editor', async (_event, targetPath: string, editor?: string) => {
    const editorCommand = editor || 'code';

    return new Promise((resolve) => {
      const proc = spawn(editorCommand, [targetPath], {
        shell: true,
        detached: true,
        stdio: 'ignore',
      });

      proc.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      // Unref the process so it doesn't keep the parent alive
      proc.unref();

      // Resolve after a short delay to allow error events to fire
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
    });
  });
}
