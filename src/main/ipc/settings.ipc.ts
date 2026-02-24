import { IpcMain } from 'electron';
import { SettingsService } from '../services/settings.service';
import type { AppSettings } from '../../shared/types/settings.types';

const settingsService = new SettingsService();

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('settings:get', async () => {
    return await settingsService.getSettings();
  });

  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    return await settingsService.saveSettings(settings);
  });

  ipcMain.handle('settings:update', async (_event, partial: Partial<AppSettings>) => {
    return await settingsService.updateSettings(partial);
  });

  ipcMain.handle('settings:reset', async () => {
    return await settingsService.resetSettings();
  });
}
