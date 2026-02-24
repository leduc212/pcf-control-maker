import { ChildProcess, spawn, exec } from 'child_process';
import path from 'path';
import os from 'os';
import type {
  CreatePcfOptions,
  CreateSolutionOptions,
  BuildOptions,
  CommandResult,
} from '../../shared/types/pcf.types';

export class PacCliService {
  private runningProcesses: Map<string, ChildProcess> = new Map();

  // Get enhanced environment that includes common tool locations and critical Windows vars
  private getEnhancedEnv(): NodeJS.ProcessEnv {
    const homeDir = os.homedir();
    const isWindows = process.platform === 'win32';

    // Start with a copy of current environment
    const env: NodeJS.ProcessEnv = { ...process.env };

    if (isWindows) {
      // Ensure critical Windows environment variables are set
      const systemRoot = env.SystemRoot || env.SYSTEMROOT || 'C:\\Windows';
      const system32 = path.join(systemRoot, 'System32');

      env.SystemRoot = systemRoot;
      env.SYSTEMROOT = systemRoot;
      env.ComSpec = env.ComSpec || env.COMSPEC || path.join(system32, 'cmd.exe');
      env.COMSPEC = env.ComSpec;

      // Add dotnet tools path (where pac is typically installed)
      const dotnetToolsPath = path.join(homeDir, '.dotnet', 'tools');

      // Build enhanced PATH with all necessary directories
      const pathParts: string[] = [];

      // Add dotnet tools first (highest priority)
      pathParts.push(dotnetToolsPath);

      // Add System32 and Windows paths
      pathParts.push(system32);
      pathParts.push(systemRoot);
      pathParts.push(path.join(system32, 'Wbem'));

      // Add existing PATH
      const currentPath = env.PATH || env.Path || '';
      if (currentPath) {
        pathParts.push(currentPath);
      }

      env.PATH = pathParts.join(';');
      env.Path = env.PATH;
    } else {
      // Unix/Mac
      const dotnetToolsPath = path.join(homeDir, '.dotnet', 'tools');
      const currentPath = env.PATH || '';

      if (!currentPath.includes(dotnetToolsPath)) {
        env.PATH = `${dotnetToolsPath}:${currentPath}`;
      }
    }

    return env;
  }

  private executeCommand(
    command: string,
    args: string[],
    cwd?: string
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      const env = this.getEnhancedEnv();
      const workingDir = cwd || process.cwd();

      // Use spawn with shell:true for better Windows compatibility
      const proc = spawn(command, args, {
        cwd: workingDir,
        env,
        shell: true,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          stdout,
          stderr: stderr || error.message,
          code: -1,
        });
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          code: code || 0,
        });
      });
    });
  }

  async checkInstallation(): Promise<{ installed: boolean; message: string }> {
    // Try pac --version first
    const result = await this.executeCommand('pac', ['--version']);

    // Check if we got any meaningful output (stdout or stderr)
    // Some versions of pac might output to stderr or return non-zero
    const output = (result.stdout + result.stderr).trim();

    // Consider installed if:
    // 1. Command succeeded (exit code 0), OR
    // 2. We got output that looks like pac (contains version number pattern)
    if (result.success || /\d+\.\d+\.\d+/.test(output) || output.toLowerCase().includes('pac')) {
      const version = output.match(/\d+\.\d+\.\d+/)?.[0] || output.split('\n')[0];
      return {
        installed: true,
        message: `PAC CLI is installed: ${version}`,
      };
    }

    return {
      installed: false,
      message: 'PAC CLI is not installed. Please install it using: dotnet tool install --global Microsoft.PowerApps.CLI.Tool',
    };
  }

  async getVersion(): Promise<string> {
    const result = await this.executeCommand('pac', ['--version']);
    return result.success ? result.stdout.trim() : 'Unknown';
  }

  async createPcf(options: CreatePcfOptions): Promise<CommandResult> {
    // First, create the output directory if it doesn't exist
    if (options.outputDirectory) {
      await this.executeCommand('mkdir', [options.outputDirectory]);
    }

    const args = [
      'pcf',
      'init',
      '--name', options.name,
      '--namespace', options.namespace,
      '--template', options.template,
    ];

    if (options.framework && options.framework !== 'none') {
      args.push('--framework', options.framework);
    }

    const workingDir = options.outputDirectory || process.cwd();
    const result = await this.executeCommand('pac', args, workingDir);

    // If successful, run npm install
    if (result.success && options.runNpmInstall !== false) {
      const npmResult = await this.executeCommand(
        'npm',
        ['install'],
        workingDir
      );

      if (!npmResult.success) {
        result.stdout += '\n\nWarning: npm install failed:\n' + npmResult.stderr;
      } else {
        result.stdout += '\n\nnpm install completed successfully.';
      }
    }

    return result;
  }

  async buildPcf(options: BuildOptions): Promise<CommandResult> {
    const args = ['run', 'build'];

    if (options.production) {
      args.push('--', '--mode', 'production');
    }

    return await this.executeCommand('npm', args, options.projectPath);
  }

  async startPcf(projectPath: string): Promise<CommandResult & { port?: number }> {
    const processKey = `watch:${projectPath}`;

    // Stop existing process if running
    if (this.runningProcesses.has(processKey)) {
      this.killProcessTree(this.runningProcesses.get(processKey)!);
      this.runningProcesses.delete(processKey);
    }

    return new Promise((resolve) => {
      const env = this.getEnhancedEnv();

      const proc = spawn('npm', ['start'], {
        cwd: projectPath,
        env,
        shell: true,
        windowsHide: true,
      });

      this.runningProcesses.set(processKey, proc);

      let output = '';
      let resolved = false;

      const tryResolve = () => {
        if (resolved) return;
        // Extract port from output (e.g., "http://localhost:8181" or "localhost:8181")
        const portMatch = output.match(/localhost:(\d+)/);
        const port = portMatch ? parseInt(portMatch[1], 10) : undefined;

        resolved = true;
        resolve({
          success: true,
          stdout: output,
          stderr: '',
          code: 0,
          port,
        });
      };

      proc.stdout?.on('data', (data) => {
        output += data.toString();
        // Check if harness is ready
        if (output.includes('Compiled successfully') || output.includes('watching') || output.includes('localhost:')) {
          tryResolve();
        }
      });

      proc.stderr?.on('data', (data) => {
        output += data.toString();
      });

      proc.on('error', (error) => {
        this.runningProcesses.delete(processKey);
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            stdout: output,
            stderr: error.message,
            code: -1,
          });
        }
      });

      proc.on('close', () => {
        this.runningProcesses.delete(processKey);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.runningProcesses.has(processKey) && !resolved) {
          tryResolve();
        }
      }, 30000);
    });
  }

  isProcessRunning(projectPath: string): boolean {
    const processKey = `watch:${projectPath}`;
    return this.runningProcesses.has(processKey);
  }

  async createSolution(options: CreateSolutionOptions): Promise<CommandResult> {
    // Note: options.name may already include the prefix from the caller
    // Use the name as-is without adding prefix again
    const solutionPath = path.join(options.outputDirectory, options.name);

    // Create solution directory
    await this.executeCommand('mkdir', [solutionPath]);

    const args = [
      'solution',
      'init',
      '--publisher-name', options.publisherName,
      '--publisher-prefix', options.publisherPrefix,
    ];

    return await this.executeCommand('pac', args, solutionPath);
  }

  async addSolutionReference(solutionPath: string, pcfPath: string): Promise<CommandResult> {
    const args = [
      'solution',
      'add-reference',
      '--path', pcfPath,
    ];

    return await this.executeCommand('pac', args, solutionPath);
  }

  async buildSolution(solutionPath: string, configuration: 'Debug' | 'Release'): Promise<CommandResult> {
    const args = [
      'build',
      '/restore',
      `/p:Configuration=${configuration}`,
    ];

    return await this.executeCommand('dotnet', args, solutionPath);
  }

  stopProcess(projectPath: string): void {
    const processKey = `watch:${projectPath}`;
    const proc = this.runningProcesses.get(processKey);
    if (proc) {
      this.killProcessTree(proc);
      this.runningProcesses.delete(processKey);
    }
  }

  private killProcessTree(proc: ChildProcess): void {
    if (!proc.pid) {
      proc.kill();
      return;
    }
    if (process.platform === 'win32') {
      // On Windows with shell:true, .kill() only kills cmd.exe, not child processes.
      // taskkill /T kills the entire process tree.
      exec(`taskkill /pid ${proc.pid} /T /F`);
    } else {
      proc.kill();
    }
  }

  async runNpmInstall(projectPath: string, packages: string[]): Promise<CommandResult> {
    const args = ['install', ...packages];
    return await this.executeCommand('npm', args, projectPath);
  }
}
