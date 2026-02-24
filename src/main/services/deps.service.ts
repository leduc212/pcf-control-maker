import { exec } from 'child_process';
import type { NpmAuditResult, NpmVulnerability, NpmOutdatedResult, NpmOutdatedPackage } from '../../shared/types/tools.types';

export class DepsService {
  private executeCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      exec(command, {
        cwd,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env },
        windowsHide: true,
      }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          code: error ? (error as NodeJS.ErrnoException & { code?: number }).code as unknown as number || 1 : 0,
        });
      });
    });
  }

  async runAudit(projectPath: string): Promise<NpmAuditResult> {
    const result = await this.executeCommand('npm audit --json', projectPath);

    const vulnerabilities: NpmVulnerability[] = [];
    const severityCounts: Record<string, number> = {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };

    try {
      const json = JSON.parse(result.stdout);

      // npm v7+ format: { vulnerabilities: { [name]: { ... } } }
      if (json.vulnerabilities && typeof json.vulnerabilities === 'object') {
        for (const [name, vuln] of Object.entries(json.vulnerabilities)) {
          const v = vuln as Record<string, unknown>;
          const severity = (v.severity as string) || 'unknown';
          severityCounts[severity] = (severityCounts[severity] || 0) + 1;

          vulnerabilities.push({
            name,
            severity,
            title: (v.title as string) || name,
            url: (v.url as string) || '',
            range: (v.range as string) || '',
            fixAvailable: Boolean(v.fixAvailable),
          });
        }
      }

      // npm v6 format: { advisories: { [id]: { ... } } }
      if (json.advisories && typeof json.advisories === 'object') {
        for (const [, advisory] of Object.entries(json.advisories)) {
          const a = advisory as Record<string, unknown>;
          const severity = (a.severity as string) || 'unknown';
          severityCounts[severity] = (severityCounts[severity] || 0) + 1;

          vulnerabilities.push({
            name: (a.module_name as string) || '',
            severity,
            title: (a.title as string) || '',
            url: (a.url as string) || '',
            range: (a.vulnerable_versions as string) || '',
            fixAvailable: Boolean(a.patched_versions && a.patched_versions !== '<0.0.0'),
          });
        }
      }
    } catch {
      // Invalid JSON - npm audit may produce no output if no vulnerabilities
    }

    return {
      vulnerabilities,
      totalVulnerabilities: vulnerabilities.length,
      severityCounts,
    };
  }

  async runOutdated(projectPath: string): Promise<NpmOutdatedResult> {
    // npm outdated exits with code 1 when outdated packages exist
    const result = await this.executeCommand('npm outdated --json', projectPath);
    const packages: NpmOutdatedPackage[] = [];

    try {
      const json = JSON.parse(result.stdout);

      for (const [name, info] of Object.entries(json)) {
        const pkg = info as Record<string, unknown>;
        packages.push({
          name,
          current: (pkg.current as string) || '',
          wanted: (pkg.wanted as string) || '',
          latest: (pkg.latest as string) || '',
          dependent: (pkg.dependent as string) || '',
          type: (pkg.type as string) || 'dependencies',
        });
      }
    } catch {
      // No outdated packages or invalid JSON
    }

    return {
      packages,
      totalOutdated: packages.length,
    };
  }

  async runAuditFix(projectPath: string): Promise<{ success: boolean; output: string; error?: string }> {
    const result = await this.executeCommand('npm audit fix', projectPath);
    return {
      success: result.code === 0,
      output: result.stdout,
      error: result.code !== 0 ? result.stderr : undefined,
    };
  }

  async runUpdate(projectPath: string, packages?: string[]): Promise<{ success: boolean; output: string; error?: string }> {
    const command = packages && packages.length > 0
      ? `npm update ${packages.join(' ')}`
      : 'npm update';

    const result = await this.executeCommand(command, projectPath);
    return {
      success: result.code === 0,
      output: result.stdout,
      error: result.code !== 0 ? result.stderr : undefined,
    };
  }
}
