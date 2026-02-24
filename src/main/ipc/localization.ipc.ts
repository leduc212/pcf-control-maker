import type { IpcMain } from 'electron';
import { LocalizationService } from '../services/localization.service';
import type {
  LocalizationEntry,
  LocalizationExportOptions,
} from '../../shared/types/localization.types';

const localizationService = new LocalizationService();

export function registerLocalizationHandlers(ipcMain: IpcMain) {
  ipcMain.handle('localization:load-project', async (_, projectPath: string) => {
    return localizationService.loadProject(projectPath);
  });

  ipcMain.handle(
    'localization:add-entry',
    async (_, basePath: string, entry: LocalizationEntry) => {
      return localizationService.addEntry(basePath, entry);
    }
  );

  ipcMain.handle(
    'localization:update-entry',
    async (
      _,
      basePath: string,
      key: string,
      values: Record<string, string>,
      comment?: string
    ) => {
      return localizationService.updateEntry(basePath, key, values, comment);
    }
  );

  ipcMain.handle('localization:delete-entry', async (_, basePath: string, key: string) => {
    return localizationService.deleteEntry(basePath, key);
  });

  ipcMain.handle(
    'localization:add-language',
    async (_, basePath: string, languageCode: string, copyFromLanguage?: string) => {
      return localizationService.addLanguage(basePath, languageCode, copyFromLanguage);
    }
  );

  ipcMain.handle(
    'localization:export-csv',
    async (_, basePath: string, outputPath: string, options: LocalizationExportOptions) => {
      return localizationService.exportToCsv(basePath, outputPath, options);
    }
  );

  ipcMain.handle('localization:import-csv', async (_, basePath: string, csvPath: string) => {
    return localizationService.importFromCsv(basePath, csvPath);
  });

  ipcMain.handle('localization:get-missing', async (_, basePath: string) => {
    return localizationService.getMissingTranslations(basePath);
  });
}
