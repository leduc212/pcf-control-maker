import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import type { PcfProject, ProjectValidation, ProjectSolutionInfo, ControlManifestInfo } from '../../shared/types/project.types';

const RECENT_PROJECTS_FILE = 'recent-projects.json';
const MAX_RECENT_PROJECTS = 10;

export class ProjectService {
  private getAppDataPath(): string {
    return path.join(app.getPath('userData'), RECENT_PROJECTS_FILE);
  }

  /**
   * Find the ControlManifest.Input.xml file in the project.
   * PAC CLI creates it in a subdirectory named after the component.
   */
  private async findManifestPath(projectPath: string): Promise<string | null> {
    // First check root directory
    const rootManifest = path.join(projectPath, 'ControlManifest.Input.xml');
    try {
      await fs.access(rootManifest);
      return rootManifest;
    } catch {
      // Not in root, check subdirectories
    }

    // Check subdirectories (PAC CLI creates component folder with same name)
    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subManifest = path.join(projectPath, entry.name, 'ControlManifest.Input.xml');
          try {
            await fs.access(subManifest);
            return subManifest;
          } catch {
            // Not in this subdirectory
          }
        }
      }
    } catch {
      // Error reading directory
    }

    return null;
  }

  /**
   * Check if this is a PCF project by looking for .pcfproj file
   */
  private async findPcfProjFile(projectPath: string): Promise<string | null> {
    try {
      const entries = await fs.readdir(projectPath);
      const pcfprojFile = entries.find(f => f.endsWith('.pcfproj'));
      if (pcfprojFile) {
        return path.join(projectPath, pcfprojFile);
      }
    } catch {
      // Error reading directory
    }
    return null;
  }

  async openProject(projectPath: string): Promise<PcfProject | null> {
    try {
      const validation = await this.validateProject(projectPath);
      if (!validation.isValid) {
        console.error('Project validation failed:', validation.errors);
        return null;
      }

      const manifestPath = await this.findManifestPath(projectPath);
      const packageJsonPath = path.join(projectPath, 'package.json');

      const project: PcfProject = {
        path: projectPath,
        name: path.basename(projectPath),
        manifestPath: manifestPath || undefined,
        packageJsonPath: validation.hasPackageJson ? packageJsonPath : undefined,
        hasSolution: validation.hasSolution,
        lastOpened: new Date().toISOString(),
      };

      await this.addToRecentProjects(projectPath);

      return project;
    } catch (error) {
      console.error('Failed to open project:', error);
      return null;
    }
  }

  async validateProject(projectPath: string): Promise<ProjectValidation> {
    const result: ProjectValidation = {
      isValid: false,
      hasManifest: false,
      hasPackageJson: false,
      hasNodeModules: false,
      hasSolution: false,
      errors: [],
    };

    try {
      // Check if directory exists
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        result.errors.push('Path is not a directory');
        return result;
      }

      // Check for .pcfproj file (indicates PAC CLI project)
      const pcfprojPath = await this.findPcfProjFile(projectPath);
      const hasPcfProj = pcfprojPath !== null;

      // Check for ControlManifest.Input.xml (can be in root or subdirectory)
      const manifestPath = await this.findManifestPath(projectPath);
      result.hasManifest = manifestPath !== null;

      if (!result.hasManifest && !hasPcfProj) {
        result.errors.push('Missing ControlManifest.Input.xml and .pcfproj file');
      }

      // Check for package.json
      try {
        await fs.access(path.join(projectPath, 'package.json'));
        result.hasPackageJson = true;
      } catch {
        result.errors.push('Missing package.json');
      }

      // Check for node_modules
      try {
        await fs.access(path.join(projectPath, 'node_modules'));
        result.hasNodeModules = true;
      } catch {
        // node_modules is optional
      }

      // Check for solution folder (.cdsproj files)
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const cdsprojPath = path.join(projectPath, entry.name, `${entry.name}.cdsproj`);
          try {
            await fs.access(cdsprojPath);
            result.hasSolution = true;
            break;
          } catch {
            // Not a solution folder
          }
        }
      }

      // Project is valid if it has manifest OR .pcfproj file (PAC CLI project)
      result.isValid = result.hasManifest || hasPcfProj;

      return result;
    } catch (error) {
      result.errors.push((error as Error).message);
      return result;
    }
  }

  async getRecentProjects(): Promise<string[]> {
    try {
      const filePath = this.getAppDataPath();
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return data.projects || [];
    } catch {
      return [];
    }
  }

  async addToRecentProjects(projectPath: string): Promise<void> {
    try {
      const projects = await this.getRecentProjects();

      // Remove if already exists
      const filtered = projects.filter(p => p !== projectPath);

      // Add to beginning
      filtered.unshift(projectPath);

      // Keep only max recent projects
      const trimmed = filtered.slice(0, MAX_RECENT_PROJECTS);

      const filePath = this.getAppDataPath();
      await fs.writeFile(filePath, JSON.stringify({ projects: trimmed }, null, 2));
    } catch (error) {
      console.error('Failed to save recent projects:', error);
    }
  }

  async removeFromRecentProjects(projectPath: string): Promise<void> {
    try {
      const projects = await this.getRecentProjects();
      const filtered = projects.filter(p => p !== projectPath);
      const filePath = this.getAppDataPath();
      await fs.writeFile(filePath, JSON.stringify({ projects: filtered }, null, 2));
    } catch (error) {
      console.error('Failed to remove from recent projects:', error);
    }
  }

  /**
   * Parse the ControlManifest.Input.xml to extract control information
   */
  async parseControlManifest(manifestPath: string): Promise<ControlManifestInfo | null> {
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');

      // Extract the <control> tag first to avoid matching XML declaration
      const controlTagMatch = content.match(/<control\s+[^>]+>/);
      const controlTag = controlTagMatch?.[0] || '';

      // Extract attributes from control tag
      const versionMatch = controlTag.match(/version="([^"]+)"/);
      const namespaceMatch = controlTag.match(/namespace="([^"]+)"/);
      const constructorMatch = controlTag.match(/constructor="([^"]+)"/);
      const displayNameMatch = controlTag.match(/display-name-key="([^"]+)"/);
      const descriptionMatch = controlTag.match(/description-key="([^"]+)"/);

      return {
        version: versionMatch?.[1] || '1.0.0',
        namespace: namespaceMatch?.[1] || '',
        constructor: constructorMatch?.[1] || '',
        displayName: displayNameMatch?.[1] || '',
        description: descriptionMatch?.[1] || '',
      };
    } catch (error) {
      console.error('Failed to parse control manifest:', error);
      return null;
    }
  }

  /**
   * Update the version in ControlManifest.Input.xml
   */
  async updateManifestVersion(manifestPath: string, newVersion: string): Promise<boolean> {
    try {
      let content = await fs.readFile(manifestPath, 'utf-8');

      // Replace version in control tag
      content = content.replace(
        /(<control[^>]*\sversion=")([^"]+)(")/,
        `$1${newVersion}$3`
      );

      await fs.writeFile(manifestPath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to update manifest version:', error);
      return false;
    }
  }

  /**
   * Increment the last number in the version string
   * e.g., "2.7.2" -> "2.7.3"
   */
  incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length === 0) return '1.0.1';

    const lastIndex = parts.length - 1;
    const lastPart = parseInt(parts[lastIndex], 10);
    if (isNaN(lastPart)) {
      parts[lastIndex] = '1';
    } else {
      parts[lastIndex] = String(lastPart + 1);
    }
    return parts.join('.');
  }

  /**
   * Scan the project folder for existing solution folders (containing .cdsproj)
   */
  async findProjectSolutions(projectPath: string): Promise<ProjectSolutionInfo[]> {
    const solutions: ProjectSolutionInfo[] = [];

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const dirPath = path.join(projectPath, entry.name);

          try {
            const subEntries = await fs.readdir(dirPath);
            const cdsprojFile = subEntries.find(f => f.endsWith('.cdsproj'));

            if (cdsprojFile) {
              solutions.push({
                name: entry.name,
                path: dirPath,
                cdsprojPath: path.join(dirPath, cdsprojFile),
              });
            }
          } catch {
            // Skip inaccessible directories
          }
        }
      }
    } catch (error) {
      console.error('Failed to find project solutions:', error);
    }

    return solutions;
  }

  /**
   * Find solution zip files in the bin folder
   */
  async findSolutionZips(solutionPath: string): Promise<{ debug?: string; release?: string }> {
    const result: { debug?: string; release?: string } = {};

    try {
      const binPath = path.join(solutionPath, 'bin');

      // Check Debug folder
      const debugPath = path.join(binPath, 'Debug');
      try {
        const debugEntries = await fs.readdir(debugPath);
        const debugZip = debugEntries.find(f => f.endsWith('.zip'));
        if (debugZip) {
          result.debug = path.join(debugPath, debugZip);
        }
      } catch {
        // Debug folder doesn't exist
      }

      // Check Release folder
      const releasePath = path.join(binPath, 'Release');
      try {
        const releaseEntries = await fs.readdir(releasePath);
        const releaseZip = releaseEntries.find(f => f.endsWith('.zip'));
        if (releaseZip) {
          result.release = path.join(releasePath, releaseZip);
        }
      } catch {
        // Release folder doesn't exist
      }
    } catch {
      // bin folder doesn't exist
    }

    return result;
  }
}
