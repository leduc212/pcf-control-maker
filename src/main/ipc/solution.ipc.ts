import { IpcMain, dialog } from 'electron';
import { SolutionService } from '../services/solution.service';
import type { CreateSolutionInput } from '../../shared/types/solution.types';

const solutionService = new SolutionService();

export function registerSolutionHandlers(ipcMain: IpcMain): void {
  // Get all solutions
  ipcMain.handle('solution:get-all', async () => {
    return await solutionService.getAllSolutions();
  });

  // Get single solution
  ipcMain.handle('solution:get', async (_event, solutionId: string) => {
    return await solutionService.getSolution(solutionId);
  });

  // Create new solution
  ipcMain.handle('solution:create', async (_event, input: CreateSolutionInput) => {
    return await solutionService.createSolution(input);
  });

  // Delete solution (from tracking, not disk)
  ipcMain.handle('solution:delete', async (_event, solutionId: string) => {
    return await solutionService.deleteSolution(solutionId);
  });

  // Add component to solution
  ipcMain.handle('solution:add-component', async (_event, solutionId: string, pcfProjectPath: string) => {
    return await solutionService.addComponent(solutionId, pcfProjectPath);
  });

  // Remove component from solution
  ipcMain.handle('solution:remove-component', async (_event, solutionId: string, componentPath: string) => {
    return await solutionService.removeComponent(solutionId, componentPath);
  });

  // Build solution
  ipcMain.handle('solution:build', async (_event, solutionId: string, configuration: 'Debug' | 'Release') => {
    return await solutionService.buildSolution(solutionId, configuration);
  });

  // Import existing solution
  ipcMain.handle('solution:import', async (_event, solutionPath: string) => {
    return await solutionService.importExistingSolution(solutionPath);
  });

  // Select solution folder dialog
  ipcMain.handle('solution:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Solution Location',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Select PCF project to add
  ipcMain.handle('solution:select-pcf-project', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select PCF Project Folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
}
