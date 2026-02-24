import type { IpcMain } from 'electron';
import { TemplateService } from '../services/template.service';
import type { TemplateCreateOptions } from '../../shared/types/template.types';

const templateService = new TemplateService();

export function registerTemplateHandlers(ipcMain: IpcMain) {
  ipcMain.handle('template:get-all', async () => {
    return templateService.getTemplates();
  });

  ipcMain.handle('template:get', async (_, templateId: string) => {
    return templateService.getTemplate(templateId);
  });

  ipcMain.handle('template:create-from', async (_, options: TemplateCreateOptions) => {
    return templateService.createFromTemplate(options);
  });
}
