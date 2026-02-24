import { IpcMain, dialog } from 'electron';
import { ProjectService } from '../services/project.service';
import { ZipService } from '../services/zip.service';
import type { UpdateSolutionZipInput } from '../../shared/types/solution.types';

const projectService = new ProjectService();
const zipService = new ZipService();

export function registerProjectHandlers(ipcMain: IpcMain): void {
  // Open folder dialog
  ipcMain.handle('project:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Project Folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Open existing project
  ipcMain.handle('project:open', async (_event, projectPath: string) => {
    return await projectService.openProject(projectPath);
  });

  // Get recent projects
  ipcMain.handle('project:get-recent', async () => {
    return await projectService.getRecentProjects();
  });

  // Add to recent projects
  ipcMain.handle('project:add-recent', async (_event, projectPath: string) => {
    return await projectService.addToRecentProjects(projectPath);
  });

  // Remove from recent projects
  ipcMain.handle('project:remove-recent', async (_event, projectPath: string) => {
    return await projectService.removeFromRecentProjects(projectPath);
  });

  // Validate project structure
  ipcMain.handle('project:validate', async (_event, projectPath: string) => {
    return await projectService.validateProject(projectPath);
  });

  // Parse control manifest to get version and other info
  ipcMain.handle('project:parse-manifest', async (_event, manifestPath: string) => {
    return await projectService.parseControlManifest(manifestPath);
  });

  // Update manifest version
  ipcMain.handle('project:update-manifest-version', async (_event, manifestPath: string, newVersion: string) => {
    return await projectService.updateManifestVersion(manifestPath, newVersion);
  });

  // Increment version
  ipcMain.handle('project:increment-version', async (_event, version: string) => {
    return projectService.incrementVersion(version);
  });

  // Find solutions in project folder
  ipcMain.handle('project:find-solutions', async (_event, projectPath: string) => {
    return await projectService.findProjectSolutions(projectPath);
  });

  // Find solution zip files
  ipcMain.handle('project:find-solution-zips', async (_event, solutionPath: string) => {
    return await projectService.findSolutionZips(solutionPath);
  });

  // Read solution.xml from zip
  ipcMain.handle('project:read-solution-zip', async (_event, zipPath: string) => {
    return await zipService.readSolutionXmlFromZip(zipPath);
  });

  // Update solution.xml in zip
  ipcMain.handle('project:update-solution-zip', async (_event, input: UpdateSolutionZipInput) => {
    return await zipService.updateSolutionZip(input);
  });
}
