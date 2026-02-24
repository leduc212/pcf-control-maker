import { IpcMain } from 'electron';
import { PacCliService } from '../services/pac-cli.service';
import type { CreatePcfOptions, CreateSolutionOptions, BuildOptions } from '../../shared/types/pcf.types';

const pacCliService = new PacCliService();

export function registerPacCliHandlers(ipcMain: IpcMain): void {
  // Check if PAC CLI is installed
  ipcMain.handle('pac:check-installation', async () => {
    return await pacCliService.checkInstallation();
  });

  // Get PAC CLI version
  ipcMain.handle('pac:version', async () => {
    return await pacCliService.getVersion();
  });

  // Create new PCF component
  ipcMain.handle('pac:pcf-init', async (_event, options: CreatePcfOptions) => {
    return await pacCliService.createPcf(options);
  });

  // Build PCF component
  ipcMain.handle('pac:pcf-build', async (_event, options: BuildOptions) => {
    return await pacCliService.buildPcf(options);
  });

  // Start PCF watch mode
  ipcMain.handle('pac:pcf-start', async (_event, projectPath: string) => {
    return await pacCliService.startPcf(projectPath);
  });

  // Create solution
  ipcMain.handle('pac:solution-init', async (_event, options: CreateSolutionOptions) => {
    return await pacCliService.createSolution(options);
  });

  // Add reference to solution
  ipcMain.handle('pac:solution-add-reference', async (_event, solutionPath: string, pcfPath: string) => {
    return await pacCliService.addSolutionReference(solutionPath, pcfPath);
  });

  // Build solution
  ipcMain.handle('pac:solution-build', async (_event, solutionPath: string, configuration: 'Debug' | 'Release') => {
    return await pacCliService.buildSolution(solutionPath, configuration);
  });

  // Stop PCF watch mode
  ipcMain.handle('pac:pcf-stop', async (_event, projectPath: string) => {
    pacCliService.stopProcess(projectPath);
    return { success: true };
  });

  // Check if PCF process is running
  ipcMain.handle('pac:pcf-is-running', async (_event, projectPath: string) => {
    return pacCliService.isProcessRunning(projectPath);
  });

  // Run npm install for packages
  ipcMain.handle('pac:npm-install', async (_event, projectPath: string, packages: string[]) => {
    return await pacCliService.runNpmInstall(projectPath, packages);
  });
}
