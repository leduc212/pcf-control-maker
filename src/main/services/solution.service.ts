import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { app } from 'electron';
import { spawn } from 'child_process';
import type { Solution, SolutionComponent, CreateSolutionInput, SolutionBuildResult } from '../../shared/types/solution.types';

const SOLUTIONS_FILE = 'solutions.json';

export class SolutionService {
  private getDataPath(): string {
    return path.join(app.getPath('userData'), SOLUTIONS_FILE);
  }

  // Get enhanced environment with dotnet tools path
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
      const pathParts: string[] = [dotnetToolsPath, system32, systemRoot];
      const currentPath = env.PATH || env.Path || '';
      if (currentPath) pathParts.push(currentPath);

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

  private executeCommand(command: string, cwd?: string): Promise<{ success: boolean; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      // Parse command into command and args
      const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const cmd = parts[0] || '';
      const args = parts.slice(1).map(arg => arg.replace(/^"|"$/g, '')); // Remove quotes

      const proc = spawn(cmd, args, {
        cwd: cwd || process.cwd(),
        env: this.getEnhancedEnv(),
        shell: true,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('error', (error: Error) => {
        resolve({
          success: false,
          stdout,
          stderr: stderr || error.message,
        });
      });

      proc.on('close', (code: number | null) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
        });
      });
    });
  }

  async getAllSolutions(): Promise<Solution[]> {
    try {
      const filePath = this.getDataPath();
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return data.solutions || [];
    } catch {
      return [];
    }
  }

  async saveSolutions(solutions: Solution[]): Promise<void> {
    const filePath = this.getDataPath();
    await fs.writeFile(filePath, JSON.stringify({ solutions }, null, 2));
  }

  async createSolution(input: CreateSolutionInput): Promise<Solution | null> {
    try {
      // Create the solution directory
      const solutionPath = path.join(input.path, input.name);
      await fs.mkdir(solutionPath, { recursive: true });

      // Run pac solution init
      const initResult = await this.executeCommand(
        `pac solution init --publisher-name ${input.publisherName} --publisher-prefix ${input.publisherPrefix}`,
        solutionPath
      );

      if (!initResult.success) {
        console.error('Failed to create solution:', initResult.stderr);
        return null;
      }

      // Create solution object
      const solution: Solution = {
        id: crypto.randomUUID(),
        name: input.name,
        path: solutionPath,
        publisherName: input.publisherName,
        publisherPrefix: input.publisherPrefix,
        components: [],
        createdAt: new Date().toISOString(),
      };

      // Save to storage
      const solutions = await this.getAllSolutions();
      solutions.push(solution);
      await this.saveSolutions(solutions);

      return solution;
    } catch (error) {
      console.error('Failed to create solution:', error);
      return null;
    }
  }

  async deleteSolution(solutionId: string): Promise<boolean> {
    try {
      const solutions = await this.getAllSolutions();
      const filtered = solutions.filter(s => s.id !== solutionId);
      await this.saveSolutions(filtered);
      return true;
    } catch (error) {
      console.error('Failed to delete solution:', error);
      return false;
    }
  }

  async addComponent(solutionId: string, pcfProjectPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const solutions = await this.getAllSolutions();
      const solution = solutions.find(s => s.id === solutionId);

      if (!solution) {
        return { success: false, error: 'Solution not found' };
      }

      // Check if component already added
      if (solution.components.some(c => c.path === pcfProjectPath)) {
        return { success: false, error: 'Component already added to this solution' };
      }

      // Get component name from path
      const componentName = path.basename(pcfProjectPath);

      // Run pac solution add-reference
      const addResult = await this.executeCommand(
        `pac solution add-reference --path "${pcfProjectPath}"`,
        solution.path
      );

      if (!addResult.success) {
        return { success: false, error: addResult.stderr };
      }

      // Update solution
      const component: SolutionComponent = {
        name: componentName,
        path: pcfProjectPath,
        addedAt: new Date().toISOString(),
      };

      solution.components.push(component);
      await this.saveSolutions(solutions);

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async removeComponent(solutionId: string, componentPath: string): Promise<boolean> {
    try {
      const solutions = await this.getAllSolutions();
      const solution = solutions.find(s => s.id === solutionId);

      if (!solution) {
        return false;
      }

      // Remove from components list
      solution.components = solution.components.filter(c => c.path !== componentPath);
      await this.saveSolutions(solutions);

      // Note: pac solution doesn't have a remove-reference command
      // The user would need to manually edit the .cdsproj file to fully remove
      // For now, we just remove from our tracking

      return true;
    } catch (error) {
      console.error('Failed to remove component:', error);
      return false;
    }
  }

  async buildSolution(solutionId: string, configuration: 'Debug' | 'Release'): Promise<SolutionBuildResult> {
    try {
      const solutions = await this.getAllSolutions();
      const solution = solutions.find(s => s.id === solutionId);

      if (!solution) {
        return { success: false, stdout: '', stderr: 'Solution not found' };
      }

      // Run dotnet build
      const buildResult = await this.executeCommand(
        `dotnet build /restore /p:Configuration=${configuration}`,
        solution.path
      );

      if (buildResult.success) {
        // Update last built time
        solution.lastBuilt = new Date().toISOString();
        await this.saveSolutions(solutions);

        // Find output path
        const outputPath = path.join(solution.path, 'bin', configuration, `${solution.name}.zip`);

        return {
          success: true,
          outputPath,
          stdout: buildResult.stdout,
          stderr: buildResult.stderr,
        };
      }

      return {
        success: false,
        stdout: buildResult.stdout,
        stderr: buildResult.stderr,
      };
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: (error as Error).message,
      };
    }
  }

  async getSolution(solutionId: string): Promise<Solution | null> {
    const solutions = await this.getAllSolutions();
    return solutions.find(s => s.id === solutionId) || null;
  }

  async importExistingSolution(solutionPath: string): Promise<Solution | null> {
    try {
      // Check if it's a valid solution directory
      const entries = await fs.readdir(solutionPath);
      const cdsprojFile = entries.find(f => f.endsWith('.cdsproj'));

      if (!cdsprojFile) {
        return null;
      }

      // Read cdsproj to get publisher info (basic parsing)
      const cdsprojPath = path.join(solutionPath, cdsprojFile);
      const cdsprojContent = await fs.readFile(cdsprojPath, 'utf-8');

      // Extract publisher info from cdsproj (simplified)
      const prefixMatch = cdsprojContent.match(/SolutionPackageType.*?Managed/i);
      const solutionName = path.basename(solutionPath);

      const solution: Solution = {
        id: crypto.randomUUID(),
        name: solutionName,
        path: solutionPath,
        publisherName: 'Imported',
        publisherPrefix: solutionName.substring(0, 3).toLowerCase(),
        components: [],
        createdAt: new Date().toISOString(),
      };

      // Save to storage
      const solutions = await this.getAllSolutions();

      // Check if already imported
      if (solutions.some(s => s.path === solutionPath)) {
        return solutions.find(s => s.path === solutionPath) || null;
      }

      solutions.push(solution);
      await this.saveSolutions(solutions);

      return solution;
    } catch (error) {
      console.error('Failed to import solution:', error);
      return null;
    }
  }
}
