import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { app } from 'electron';
import type {
  EnvironmentProfile,
  PacAuthProfile,
  DeploymentRecord,
  DeploymentOptions,
  ImportResult,
  AuthenticationType,
} from '../../shared/types/environment.types';
import type { DeployedSolution } from '../../shared/types/connection.types';

interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

export class EnvironmentService {
  private profilesPath: string;
  private deploymentsPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.profilesPath = path.join(userDataPath, 'environments.json');
    this.deploymentsPath = path.join(userDataPath, 'deployments.json');
  }

  // Get enhanced environment for PAC CLI
  private getEnhancedEnv(): NodeJS.ProcessEnv {
    const homeDir = os.homedir();
    const isWindows = process.platform === 'win32';
    const env: NodeJS.ProcessEnv = { ...process.env };

    if (isWindows) {
      const systemRoot = env.SystemRoot || env.SYSTEMROOT || 'C:\\Windows';
      const system32 = path.join(systemRoot, 'System32');

      env.SystemRoot = systemRoot;
      env.SYSTEMROOT = systemRoot;
      env.ComSpec = env.ComSpec || env.COMSPEC || path.join(system32, 'cmd.exe');
      env.COMSPEC = env.ComSpec;

      const dotnetToolsPath = path.join(homeDir, '.dotnet', 'tools');
      const pathParts: string[] = [
        dotnetToolsPath,
        system32,
        systemRoot,
        path.join(system32, 'Wbem'),
      ];

      const currentPath = env.PATH || env.Path || '';
      if (currentPath) {
        pathParts.push(currentPath);
      }

      env.PATH = pathParts.join(';');
      env.Path = env.PATH;
    } else {
      const dotnetToolsPath = path.join(homeDir, '.dotnet', 'tools');
      const currentPath = env.PATH || '';
      if (!currentPath.includes(dotnetToolsPath)) {
        env.PATH = `${dotnetToolsPath}:${currentPath}`;
      }
    }

    return env;
  }

  private executeCommand(command: string, args: string[], cwd?: string): Promise<CommandResult> {
    return new Promise((resolve) => {
      const env = this.getEnhancedEnv();
      const workingDir = cwd || process.cwd();

      const proc = spawn(command, args, {
        cwd: workingDir,
        env,
        shell: true,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('error', (error: Error) => {
        resolve({
          success: false,
          stdout,
          stderr: stderr || error.message,
          code: -1,
        });
      });

      proc.on('close', (code: number | null) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          code: code ?? -1,
        });
      });
    });
  }

  // ==================== Profile Management ====================

  async getProfiles(): Promise<EnvironmentProfile[]> {
    try {
      const data = await fs.readFile(this.profilesPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveProfile(profile: EnvironmentProfile): Promise<void> {
    const profiles = await this.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);

    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }

    await fs.writeFile(this.profilesPath, JSON.stringify(profiles, null, 2));
  }

  async deleteProfile(profileId: string): Promise<void> {
    const profiles = await this.getProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);
    await fs.writeFile(this.profilesPath, JSON.stringify(filtered, null, 2));
  }

  // ==================== Authentication ====================

  async getAuthStatus(): Promise<{ profiles: PacAuthProfile[] }> {
    const result = await this.executeCommand('pac', ['auth', 'list']);

    if (!result.success && !result.stdout) {
      return { profiles: [] };
    }

    // Parse pac auth list output
    const profiles = this.parseAuthList(result.stdout);
    return { profiles };
  }

  private parseAuthList(output: string): PacAuthProfile[] {
    const profiles: PacAuthProfile[] = [];
    const lines = output.split('\n');

    // PAC auth list output format:
    // Index   Active  Kind        Name                   Url                                    User                   Cloud
    // [1]     *       DATAVERSE   org-name               https://org.crm.dynamics.com/          user@example.com       Public

    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and header lines
      if (!trimmed || trimmed.startsWith('Index') || trimmed.startsWith('-')) {
        if (trimmed.startsWith('Index')) inTable = true;
        continue;
      }

      if (!inTable) continue;

      // Parse the line - look for [index] pattern
      const indexMatch = trimmed.match(/^\[(\d+)\]\s+(\*)?\s+(\S+)\s+(\S+)\s+(\S+)/);
      if (indexMatch) {
        const [, indexStr, activeMarker, kind, name, url] = indexMatch;

        // Try to extract more fields
        const parts = trimmed.split(/\s{2,}/); // Split by multiple spaces
        const user = parts.length > 5 ? parts[5] : undefined;
        const cloud = parts.length > 6 ? parts[6] : undefined;

        profiles.push({
          index: parseInt(indexStr, 10),
          active: activeMarker === '*',
          kind,
          name,
          url,
          user,
          cloudInstance: cloud,
        });
      }
    }

    return profiles;
  }

  async authenticate(options: {
    url: string;
    authenticationType: AuthenticationType;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const args = ['auth', 'create', '--url', options.url];

    switch (options.authenticationType) {
      case 'interactive':
        // Default, no additional args needed
        break;
      case 'devicecode':
        args.push('--deviceCode');
        break;
      case 'serviceprincipal':
        if (!options.tenantId || !options.clientId || !options.clientSecret) {
          return { success: false, error: 'Service principal requires tenantId, clientId, and clientSecret' };
        }
        args.push(
          '--tenant', options.tenantId,
          '--applicationId', options.clientId,
          '--clientSecret', options.clientSecret
        );
        break;
      case 'certificate':
        return { success: false, error: 'Certificate authentication not yet supported' };
    }

    const result = await this.executeCommand('pac', args);

    if (result.success || result.stdout.toLowerCase().includes('successfully')) {
      return { success: true };
    }

    return {
      success: false,
      error: result.stderr || result.stdout || 'Authentication failed',
    };
  }

  async selectAuth(index: number): Promise<{ success: boolean; error?: string }> {
    const result = await this.executeCommand('pac', ['auth', 'select', '--index', String(index)]);

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.stderr || 'Failed to select auth profile',
    };
  }

  async clearAuth(index: number): Promise<{ success: boolean; error?: string }> {
    const result = await this.executeCommand('pac', ['auth', 'delete', '--index', String(index)]);

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.stderr || 'Failed to delete auth profile',
    };
  }

  async clearAllAuth(): Promise<{ success: boolean; error?: string }> {
    const result = await this.executeCommand('pac', ['auth', 'clear']);

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.stderr || 'Failed to clear all auth profiles',
    };
  }

  // ==================== Solution List ====================

  async listSolutions(): Promise<DeployedSolution[]> {
    const result = await this.executeCommand('pac', ['solution', 'list']);

    if (!result.success && !result.stdout) {
      return [];
    }

    return this.parseSolutionList(result.stdout);
  }

  private parseSolutionList(output: string): DeployedSolution[] {
    const solutions: DeployedSolution[] = [];
    const lines = output.split('\n');

    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('-')) {
        if (inTable && !trimmed) break;
        continue;
      }

      if (trimmed.match(/Unique Name/i)) {
        inTable = true;
        continue;
      }

      if (!inTable) continue;

      // Parse table rows — split by multiple spaces
      const parts = trimmed.split(/\s{2,}/);
      if (parts.length >= 4) {
        solutions.push({
          uniqueName: parts[0]?.trim() || '',
          friendlyName: parts[1]?.trim() || '',
          version: parts[2]?.trim() || '',
          isManaged: (parts[3]?.trim() || '').toLowerCase() === 'true' || (parts[3]?.trim() || '').toLowerCase() === 'managed',
          publisher: parts[4]?.trim() || '',
          installedOn: parts[5]?.trim() || '',
        });
      }
    }

    return solutions;
  }

  // ==================== Deployment ====================

  async deploySolution(options: DeploymentOptions): Promise<ImportResult> {
    const args = ['solution', 'import', '--path', options.solutionPath];

    if (options.importAsHolding) {
      args.push('--import-as-holding');
    }

    if (options.publishWorkflows) {
      args.push('--activate-plugins');
    }

    if (options.overwriteUnmanagedCustomizations) {
      args.push('--force-overwrite');
    }

    if (options.convertToManaged) {
      args.push('--convert-to-managed');
    }

    const startTime = Date.now();
    const result = await this.executeCommand('pac', args);
    const duration = Date.now() - startTime;

    // Parse solution name and version from output
    let solutionName: string | undefined;
    let version: string | undefined;

    if (result.stdout) {
      const nameMatch = result.stdout.match(/Solution\s+['"]?([^'"]+)['"]?\s+imported/i);
      if (nameMatch) solutionName = nameMatch[1];

      const versionMatch = result.stdout.match(/version\s+['"]?([0-9.]+)['"]?/i);
      if (versionMatch) version = versionMatch[1];
    }

    return {
      success: result.success,
      solutionName,
      version,
      stdout: result.stdout,
      stderr: result.stderr,
      duration,
    };
  }

  // ==================== Deployment History ====================

  async getDeployments(): Promise<DeploymentRecord[]> {
    try {
      const data = await fs.readFile(this.deploymentsPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveDeployment(deployment: DeploymentRecord): Promise<void> {
    const deployments = await this.getDeployments();
    const index = deployments.findIndex(d => d.id === deployment.id);

    if (index >= 0) {
      deployments[index] = deployment;
    } else {
      deployments.unshift(deployment); // Add to beginning
    }

    // Keep only last 100 deployments
    const trimmed = deployments.slice(0, 100);
    await fs.writeFile(this.deploymentsPath, JSON.stringify(trimmed, null, 2));
  }

  async clearDeployments(): Promise<void> {
    await fs.writeFile(this.deploymentsPath, JSON.stringify([], null, 2));
  }
}
