import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import type { BundleAnalysis, DependencyInfo, BundleSizeHistory, BundleSizeEntry } from '../../shared/types/tools.types';

const MAX_HISTORY_ENTRIES = 50;

export class ProfilerService {
  private historyPath: string;

  constructor() {
    this.historyPath = path.join(app.getPath('userData'), 'bundle-history.json');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }

  async analyzeBundleSize(projectPath: string): Promise<BundleAnalysis> {
    // Look for bundle files in out/controls/*/bundle.js
    const outDir = path.join(projectPath, 'out', 'controls');
    let bundlePath = '';
    let bundleSizeBytes = 0;

    try {
      const controlDirs = await fs.readdir(outDir, { withFileTypes: true });
      for (const dir of controlDirs) {
        if (dir.isDirectory()) {
          const bundleFile = path.join(outDir, dir.name, 'bundle.js');
          try {
            const stats = await fs.stat(bundleFile);
            bundlePath = bundleFile;
            bundleSizeBytes = stats.size;
            break;
          } catch {
            // No bundle.js in this directory
          }
        }
      }
    } catch {
      // out/controls directory doesn't exist
    }

    // Read package.json for dependencies
    const dependencies: DependencyInfo[] = [];
    let dependencyCount = 0;

    try {
      const pkgContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgContent);

      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          dependencies.push({ name, version: version as string, isDev: false });
        }
      }
      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          dependencies.push({ name, version: version as string, isDev: true });
        }
      }

      dependencyCount = dependencies.length;
    } catch {
      // No package.json or invalid JSON
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (bundleSizeBytes > 500 * 1024) {
      recommendations.push(`Bundle size (${this.formatBytes(bundleSizeBytes)}) exceeds 500 KB. Consider code splitting or removing unused dependencies.`);
    }

    if (bundleSizeBytes > 1024 * 1024) {
      recommendations.push(`Bundle size exceeds 1 MB. This may cause slow loading in Power Apps.`);
    }

    // Check for production dependencies that should be devDependencies
    const devOnlyPackages = ['typescript', 'eslint', 'prettier', 'jest', '@types/'];
    for (const dep of dependencies) {
      if (!dep.isDev) {
        for (const devPkg of devOnlyPackages) {
          if (dep.name.startsWith(devPkg) || dep.name === devPkg) {
            recommendations.push(`"${dep.name}" is in dependencies but should likely be in devDependencies.`);
          }
        }
      }
    }

    if (bundleSizeBytes === 0) {
      recommendations.push('No bundle found. Run a build first to generate the bundle.');
    }

    return {
      bundlePath,
      bundleSizeBytes,
      bundleSizeFormatted: this.formatBytes(bundleSizeBytes),
      dependencyCount,
      dependencies,
      recommendations,
    };
  }

  async getBundleHistory(projectPath: string): Promise<BundleSizeHistory> {
    try {
      const data = await fs.readFile(this.historyPath, 'utf-8');
      const allHistories: BundleSizeHistory[] = JSON.parse(data);
      const history = allHistories.find(h => h.projectPath === projectPath);
      return history || { projectPath, entries: [] };
    } catch {
      return { projectPath, entries: [] };
    }
  }

  async recordBundleSize(projectPath: string, entry: BundleSizeEntry): Promise<void> {
    let allHistories: BundleSizeHistory[] = [];

    try {
      const data = await fs.readFile(this.historyPath, 'utf-8');
      allHistories = JSON.parse(data);
    } catch {
      // No history file yet
    }

    const historyIndex = allHistories.findIndex(h => h.projectPath === projectPath);

    if (historyIndex >= 0) {
      allHistories[historyIndex].entries.unshift(entry);
      allHistories[historyIndex].entries = allHistories[historyIndex].entries.slice(0, MAX_HISTORY_ENTRIES);
    } else {
      allHistories.push({ projectPath, entries: [entry] });
    }

    await fs.writeFile(this.historyPath, JSON.stringify(allHistories, null, 2));
  }
}
