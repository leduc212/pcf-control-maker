import type { IpcMain } from 'electron';
import { dialog } from 'electron';
import { DocsService } from '../services/docs.service';
import { ProfilerService } from '../services/profiler.service';
import { DiffService } from '../services/diff.service';
import { DepsService } from '../services/deps.service';
import type { DocGeneratorInput, SolutionDiffInput, BundleSizeEntry } from '../../shared/types/tools.types';

const docsService = new DocsService();
const profilerService = new ProfilerService();
const diffService = new DiffService();
const depsService = new DepsService();

export function registerToolsHandlers(ipcMain: IpcMain) {
  // Documentation Generator
  ipcMain.handle('tools:generate-docs', async (_, input: DocGeneratorInput) => {
    return docsService.generateReadme(input);
  });

  // Bundle Analyzer
  ipcMain.handle('tools:analyze-bundle', async (_, projectPath: string) => {
    return profilerService.analyzeBundleSize(projectPath);
  });

  ipcMain.handle('tools:bundle-history', async (_, projectPath: string) => {
    return profilerService.getBundleHistory(projectPath);
  });

  ipcMain.handle('tools:record-bundle-size', async (_, projectPath: string, entry: BundleSizeEntry) => {
    await profilerService.recordBundleSize(projectPath, entry);
    return { success: true };
  });

  // Solution Diff
  ipcMain.handle('tools:diff-solutions', async (_, input: SolutionDiffInput) => {
    return diffService.compareSolutions(input);
  });

  ipcMain.handle('tools:diff-report', async (_, result) => {
    return diffService.generateDiffReport(result);
  });

  ipcMain.handle('tools:select-zip', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Solution Zip',
      filters: [{ name: 'ZIP files', extensions: ['zip'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Dependency Management
  ipcMain.handle('tools:npm-audit', async (_, projectPath: string) => {
    return depsService.runAudit(projectPath);
  });

  ipcMain.handle('tools:npm-outdated', async (_, projectPath: string) => {
    return depsService.runOutdated(projectPath);
  });

  ipcMain.handle('tools:npm-audit-fix', async (_, projectPath: string) => {
    return depsService.runAuditFix(projectPath);
  });

  ipcMain.handle('tools:npm-update', async (_, projectPath: string, packages?: string[]) => {
    return depsService.runUpdate(projectPath, packages);
  });
}
