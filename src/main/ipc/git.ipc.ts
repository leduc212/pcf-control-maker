import type { IpcMain } from 'electron';
import { GitService } from '../services/git.service';
import type { GitCommitOptions, GitPushOptions, GitPullOptions } from '../../shared/types/git.types';

const gitService = new GitService();

export function registerGitHandlers(ipcMain: IpcMain) {
  ipcMain.handle('git:is-repo', async (_, projectPath: string) => {
    return gitService.isGitRepo(projectPath);
  });

  ipcMain.handle('git:status', async (_, projectPath: string) => {
    return gitService.getStatus(projectPath);
  });

  ipcMain.handle('git:branches', async (_, projectPath: string) => {
    return gitService.getBranches(projectPath);
  });

  ipcMain.handle('git:commits', async (_, projectPath: string, limit?: number) => {
    return gitService.getCommits(projectPath, limit);
  });

  ipcMain.handle('git:stage', async (_, projectPath: string, files?: string[]) => {
    return gitService.stage(projectPath, files);
  });

  ipcMain.handle('git:unstage', async (_, projectPath: string, files?: string[]) => {
    return gitService.unstage(projectPath, files);
  });

  ipcMain.handle('git:commit', async (_, projectPath: string, options: GitCommitOptions) => {
    return gitService.commit(projectPath, options);
  });

  ipcMain.handle('git:push', async (_, projectPath: string, options?: GitPushOptions) => {
    return gitService.push(projectPath, options);
  });

  ipcMain.handle('git:pull', async (_, projectPath: string, options?: GitPullOptions) => {
    return gitService.pull(projectPath, options);
  });

  ipcMain.handle('git:checkout', async (_, projectPath: string, branch: string) => {
    return gitService.checkout(projectPath, branch);
  });

  ipcMain.handle('git:create-branch', async (_, projectPath: string, branchName: string, checkout?: boolean) => {
    return gitService.createBranch(projectPath, branchName, checkout);
  });

  ipcMain.handle('git:init', async (_, projectPath: string) => {
    return gitService.init(projectPath);
  });

  ipcMain.handle('git:generate-message', async (_, projectPath: string) => {
    return gitService.generateCommitMessage(projectPath);
  });
}
