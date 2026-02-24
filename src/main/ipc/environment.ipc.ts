import type { IpcMain } from 'electron';
import { EnvironmentService } from '../services/environment.service';
import type {
  EnvironmentProfile,
  DeploymentRecord,
  DeploymentOptions,
  AuthenticationType,
} from '../../shared/types/environment.types';

const environmentService = new EnvironmentService();

export function registerEnvironmentHandlers(ipcMain: IpcMain) {
  // Profile management
  ipcMain.handle('environment:get-profiles', async () => {
    return environmentService.getProfiles();
  });

  ipcMain.handle('environment:save-profile', async (_, profile: EnvironmentProfile) => {
    await environmentService.saveProfile(profile);
    return { success: true };
  });

  ipcMain.handle('environment:delete-profile', async (_, profileId: string) => {
    await environmentService.deleteProfile(profileId);
    return { success: true };
  });

  // Authentication
  ipcMain.handle('environment:get-auth-status', async () => {
    return environmentService.getAuthStatus();
  });

  ipcMain.handle('environment:authenticate', async (_, options: {
    url: string;
    authenticationType: AuthenticationType;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
  }) => {
    return environmentService.authenticate(options);
  });

  ipcMain.handle('environment:select-auth', async (_, index: number) => {
    return environmentService.selectAuth(index);
  });

  ipcMain.handle('environment:clear-auth', async (_, index: number) => {
    return environmentService.clearAuth(index);
  });

  ipcMain.handle('environment:clear-all-auth', async () => {
    return environmentService.clearAllAuth();
  });

  // Solution List
  ipcMain.handle('environment:list-solutions', async () => {
    return environmentService.listSolutions();
  });

  // Deployment
  ipcMain.handle('environment:deploy', async (_, options: DeploymentOptions) => {
    return environmentService.deploySolution(options);
  });

  // Deployment history
  ipcMain.handle('environment:get-deployments', async () => {
    return environmentService.getDeployments();
  });

  ipcMain.handle('environment:save-deployment', async (_, deployment: DeploymentRecord) => {
    await environmentService.saveDeployment(deployment);
    return { success: true };
  });

  ipcMain.handle('environment:clear-deployments', async () => {
    await environmentService.clearDeployments();
    return { success: true };
  });
}
