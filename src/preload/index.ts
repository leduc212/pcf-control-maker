import { contextBridge, ipcRenderer } from 'electron';
import type { CreatePcfOptions, CreateSolutionOptions, BuildOptions } from '../shared/types/pcf.types';
import type { CreateSolutionInput, Solution, SolutionBuildResult, SolutionZipInfo, UpdateSolutionZipInput } from '../shared/types/solution.types';
import type { ProjectSolutionInfo, ControlManifestInfo } from '../shared/types/project.types';
import type { AppSettings } from '../shared/types/settings.types';
import type { EnvironmentProfile, DeploymentRecord, DeploymentOptions, AuthenticationType, PacAuthProfile, ImportResult } from '../shared/types/environment.types';
import type { ControlTemplate, TemplateCreateOptions } from '../shared/types/template.types';
import type { LocalizationEntry, LocalizationProject, LocalizationExportOptions, LocalizationImportResult } from '../shared/types/localization.types';
import type { GitStatus, GitBranch, GitCommit, GitCommitOptions, GitPushOptions, GitPullOptions } from '../shared/types/git.types';
import type { DocGeneratorInput, GeneratedDoc, BundleAnalysis, BundleSizeHistory, BundleSizeEntry, SolutionDiffInput, SolutionDiffResult, NpmAuditResult, NpmOutdatedResult } from '../shared/types/tools.types';
import type { DeployedSolution } from '../shared/types/connection.types';

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Project operations
  project: {
    selectFolder: () => ipcRenderer.invoke('project:select-folder'),
    open: (projectPath: string) => ipcRenderer.invoke('project:open', projectPath),
    getRecent: () => ipcRenderer.invoke('project:get-recent'),
    addRecent: (projectPath: string) => ipcRenderer.invoke('project:add-recent', projectPath),
    removeRecent: (projectPath: string) => ipcRenderer.invoke('project:remove-recent', projectPath),
    validate: (projectPath: string) => ipcRenderer.invoke('project:validate', projectPath),
    parseManifest: (manifestPath: string) => ipcRenderer.invoke('project:parse-manifest', manifestPath),
    updateManifestVersion: (manifestPath: string, newVersion: string) =>
      ipcRenderer.invoke('project:update-manifest-version', manifestPath, newVersion),
    incrementVersion: (version: string) => ipcRenderer.invoke('project:increment-version', version),
    findSolutions: (projectPath: string) => ipcRenderer.invoke('project:find-solutions', projectPath),
    findSolutionZips: (solutionPath: string) => ipcRenderer.invoke('project:find-solution-zips', solutionPath),
    readSolutionZip: (zipPath: string) => ipcRenderer.invoke('project:read-solution-zip', zipPath),
    updateSolutionZip: (input: UpdateSolutionZipInput) => ipcRenderer.invoke('project:update-solution-zip', input),
  },

  // PAC CLI operations
  pac: {
    checkInstallation: () => ipcRenderer.invoke('pac:check-installation'),
    version: () => ipcRenderer.invoke('pac:version'),
    pcfInit: (options: CreatePcfOptions) => ipcRenderer.invoke('pac:pcf-init', options),
    pcfBuild: (options: BuildOptions) => ipcRenderer.invoke('pac:pcf-build', options),
    pcfStart: (projectPath: string) => ipcRenderer.invoke('pac:pcf-start', projectPath),
    pcfStop: (projectPath: string) => ipcRenderer.invoke('pac:pcf-stop', projectPath),
    pcfIsRunning: (projectPath: string) => ipcRenderer.invoke('pac:pcf-is-running', projectPath),
    solutionInit: (options: CreateSolutionOptions) => ipcRenderer.invoke('pac:solution-init', options),
    solutionAddReference: (solutionPath: string, pcfPath: string) =>
      ipcRenderer.invoke('pac:solution-add-reference', solutionPath, pcfPath),
    solutionBuild: (solutionPath: string, configuration: 'Debug' | 'Release') =>
      ipcRenderer.invoke('pac:solution-build', solutionPath, configuration),
    npmInstall: (projectPath: string, packages: string[]) =>
      ipcRenderer.invoke('pac:npm-install', projectPath, packages),
  },

  // Solution management operations
  solution: {
    getAll: () => ipcRenderer.invoke('solution:get-all'),
    get: (solutionId: string) => ipcRenderer.invoke('solution:get', solutionId),
    create: (input: CreateSolutionInput) => ipcRenderer.invoke('solution:create', input),
    delete: (solutionId: string) => ipcRenderer.invoke('solution:delete', solutionId),
    addComponent: (solutionId: string, pcfProjectPath: string) =>
      ipcRenderer.invoke('solution:add-component', solutionId, pcfProjectPath),
    removeComponent: (solutionId: string, componentPath: string) =>
      ipcRenderer.invoke('solution:remove-component', solutionId, componentPath),
    build: (solutionId: string, configuration: 'Debug' | 'Release') =>
      ipcRenderer.invoke('solution:build', solutionId, configuration),
    import: (solutionPath: string) => ipcRenderer.invoke('solution:import', solutionPath),
    selectFolder: () => ipcRenderer.invoke('solution:select-folder'),
    selectPcfProject: () => ipcRenderer.invoke('solution:select-pcf-project'),
  },

  // File system operations
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', filePath, content),
    exists: (targetPath: string) => ipcRenderer.invoke('fs:exists', targetPath),
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:read-dir', dirPath),
    mkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),
    openInExplorer: (targetPath: string) => ipcRenderer.invoke('fs:open-in-explorer', targetPath),
    openExternal: (url: string) => ipcRenderer.invoke('fs:open-external', url),
    saveDialog: (options: Electron.SaveDialogOptions) => ipcRenderer.invoke('fs:save-dialog', options),
    openInEditor: (targetPath: string, editor?: string) => ipcRenderer.invoke('fs:open-in-editor', targetPath, editor),
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings),
    update: (partial: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', partial),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },

  // Environment operations
  environment: {
    // Profile management
    getProfiles: () => ipcRenderer.invoke('environment:get-profiles'),
    saveProfile: (profile: EnvironmentProfile) => ipcRenderer.invoke('environment:save-profile', profile),
    deleteProfile: (profileId: string) => ipcRenderer.invoke('environment:delete-profile', profileId),

    // Authentication
    getAuthStatus: () => ipcRenderer.invoke('environment:get-auth-status'),
    authenticate: (options: {
      url: string;
      authenticationType: AuthenticationType;
      tenantId?: string;
      clientId?: string;
      clientSecret?: string;
    }) => ipcRenderer.invoke('environment:authenticate', options),
    selectAuth: (index: number) => ipcRenderer.invoke('environment:select-auth', index),
    clearAuth: (index: number) => ipcRenderer.invoke('environment:clear-auth', index),
    clearAllAuth: () => ipcRenderer.invoke('environment:clear-all-auth'),

    // Solution List
    listSolutions: () => ipcRenderer.invoke('environment:list-solutions'),

    // Deployment
    deploy: (options: DeploymentOptions) => ipcRenderer.invoke('environment:deploy', options),

    // Deployment history
    getDeployments: () => ipcRenderer.invoke('environment:get-deployments'),
    saveDeployment: (deployment: DeploymentRecord) => ipcRenderer.invoke('environment:save-deployment', deployment),
    clearDeployments: () => ipcRenderer.invoke('environment:clear-deployments'),
  },

  // Template operations
  template: {
    getAll: () => ipcRenderer.invoke('template:get-all'),
    get: (templateId: string) => ipcRenderer.invoke('template:get', templateId),
    createFrom: (options: TemplateCreateOptions) => ipcRenderer.invoke('template:create-from', options),
  },

  // Localization operations
  localization: {
    loadProject: (projectPath: string) => ipcRenderer.invoke('localization:load-project', projectPath),
    addEntry: (basePath: string, entry: LocalizationEntry) =>
      ipcRenderer.invoke('localization:add-entry', basePath, entry),
    updateEntry: (basePath: string, key: string, values: Record<string, string>, comment?: string) =>
      ipcRenderer.invoke('localization:update-entry', basePath, key, values, comment),
    deleteEntry: (basePath: string, key: string) =>
      ipcRenderer.invoke('localization:delete-entry', basePath, key),
    addLanguage: (basePath: string, languageCode: string, copyFromLanguage?: string) =>
      ipcRenderer.invoke('localization:add-language', basePath, languageCode, copyFromLanguage),
    exportCsv: (basePath: string, outputPath: string, options: LocalizationExportOptions) =>
      ipcRenderer.invoke('localization:export-csv', basePath, outputPath, options),
    importCsv: (basePath: string, csvPath: string) =>
      ipcRenderer.invoke('localization:import-csv', basePath, csvPath),
    getMissing: (basePath: string) => ipcRenderer.invoke('localization:get-missing', basePath),
  },

  // Git operations
  git: {
    isRepo: (projectPath: string) => ipcRenderer.invoke('git:is-repo', projectPath),
    status: (projectPath: string) => ipcRenderer.invoke('git:status', projectPath),
    branches: (projectPath: string) => ipcRenderer.invoke('git:branches', projectPath),
    commits: (projectPath: string, limit?: number) => ipcRenderer.invoke('git:commits', projectPath, limit),
    stage: (projectPath: string, files?: string[]) => ipcRenderer.invoke('git:stage', projectPath, files),
    unstage: (projectPath: string, files?: string[]) => ipcRenderer.invoke('git:unstage', projectPath, files),
    commit: (projectPath: string, options: GitCommitOptions) => ipcRenderer.invoke('git:commit', projectPath, options),
    push: (projectPath: string, options?: GitPushOptions) => ipcRenderer.invoke('git:push', projectPath, options),
    pull: (projectPath: string, options?: GitPullOptions) => ipcRenderer.invoke('git:pull', projectPath, options),
    checkout: (projectPath: string, branch: string) => ipcRenderer.invoke('git:checkout', projectPath, branch),
    createBranch: (projectPath: string, branchName: string, checkout?: boolean) =>
      ipcRenderer.invoke('git:create-branch', projectPath, branchName, checkout),
    init: (projectPath: string) => ipcRenderer.invoke('git:init', projectPath),
    generateMessage: (projectPath: string) => ipcRenderer.invoke('git:generate-message', projectPath),
  },

  // Tools operations
  tools: {
    generateDocs: (input: DocGeneratorInput) => ipcRenderer.invoke('tools:generate-docs', input),
    analyzeBundle: (projectPath: string) => ipcRenderer.invoke('tools:analyze-bundle', projectPath),
    bundleHistory: (projectPath: string) => ipcRenderer.invoke('tools:bundle-history', projectPath),
    recordBundleSize: (projectPath: string, entry: BundleSizeEntry) =>
      ipcRenderer.invoke('tools:record-bundle-size', projectPath, entry),
    diffSolutions: (input: SolutionDiffInput) => ipcRenderer.invoke('tools:diff-solutions', input),
    diffReport: (result: SolutionDiffResult) => ipcRenderer.invoke('tools:diff-report', result),
    selectZip: () => ipcRenderer.invoke('tools:select-zip'),
    npmAudit: (projectPath: string) => ipcRenderer.invoke('tools:npm-audit', projectPath),
    npmOutdated: (projectPath: string) => ipcRenderer.invoke('tools:npm-outdated', projectPath),
    npmAuditFix: (projectPath: string) => ipcRenderer.invoke('tools:npm-audit-fix', projectPath),
    npmUpdate: (projectPath: string, packages?: string[]) =>
      ipcRenderer.invoke('tools:npm-update', projectPath, packages),
  },
});

// Type declaration for the exposed API
export interface ElectronAPI {
  project: {
    selectFolder: () => Promise<string | null>;
    open: (projectPath: string) => Promise<unknown>;
    getRecent: () => Promise<string[]>;
    addRecent: (projectPath: string) => Promise<void>;
    removeRecent: (projectPath: string) => Promise<void>;
    validate: (projectPath: string) => Promise<unknown>;
    parseManifest: (manifestPath: string) => Promise<ControlManifestInfo | null>;
    updateManifestVersion: (manifestPath: string, newVersion: string) => Promise<boolean>;
    incrementVersion: (version: string) => Promise<string>;
    findSolutions: (projectPath: string) => Promise<ProjectSolutionInfo[]>;
    findSolutionZips: (solutionPath: string) => Promise<{ debug?: string; release?: string }>;
    readSolutionZip: (zipPath: string) => Promise<SolutionZipInfo | null>;
    updateSolutionZip: (input: UpdateSolutionZipInput) => Promise<{ success: boolean; error?: string }>;
  };
  pac: {
    checkInstallation: () => Promise<{ installed: boolean; message: string }>;
    version: () => Promise<string>;
    pcfInit: (options: CreatePcfOptions) => Promise<unknown>;
    pcfBuild: (options: BuildOptions) => Promise<unknown>;
    pcfStart: (projectPath: string) => Promise<unknown>;
    pcfStop: (projectPath: string) => Promise<{ success: boolean }>;
    pcfIsRunning: (projectPath: string) => Promise<boolean>;
    solutionInit: (options: CreateSolutionOptions) => Promise<unknown>;
    solutionAddReference: (solutionPath: string, pcfPath: string) => Promise<unknown>;
    solutionBuild: (solutionPath: string, configuration: 'Debug' | 'Release') => Promise<unknown>;
    npmInstall: (projectPath: string, packages: string[]) => Promise<unknown>;
  };
  solution: {
    getAll: () => Promise<Solution[]>;
    get: (solutionId: string) => Promise<Solution | null>;
    create: (input: CreateSolutionInput) => Promise<Solution | null>;
    delete: (solutionId: string) => Promise<boolean>;
    addComponent: (solutionId: string, pcfProjectPath: string) => Promise<{ success: boolean; error?: string }>;
    removeComponent: (solutionId: string, componentPath: string) => Promise<boolean>;
    build: (solutionId: string, configuration: 'Debug' | 'Release') => Promise<SolutionBuildResult>;
    import: (solutionPath: string) => Promise<Solution | null>;
    selectFolder: () => Promise<string | null>;
    selectPcfProject: () => Promise<string | null>;
  };
  fs: {
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    exists: (targetPath: string) => Promise<boolean>;
    readDir: (dirPath: string) => Promise<{ success: boolean; entries?: unknown[]; error?: string }>;
    mkdir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    openInExplorer: (targetPath: string) => Promise<{ success: boolean }>;
    openExternal: (url: string) => Promise<{ success: boolean }>;
    saveDialog: (options: Electron.SaveDialogOptions) => Promise<string | null>;
    openInEditor: (targetPath: string, editor?: string) => Promise<{ success: boolean; error?: string }>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    save: (settings: AppSettings) => Promise<boolean>;
    update: (partial: Partial<AppSettings>) => Promise<AppSettings>;
    reset: () => Promise<AppSettings>;
  };
  environment: {
    getProfiles: () => Promise<EnvironmentProfile[]>;
    saveProfile: (profile: EnvironmentProfile) => Promise<{ success: boolean }>;
    deleteProfile: (profileId: string) => Promise<{ success: boolean }>;
    getAuthStatus: () => Promise<{ profiles: PacAuthProfile[] }>;
    authenticate: (options: {
      url: string;
      authenticationType: AuthenticationType;
      tenantId?: string;
      clientId?: string;
      clientSecret?: string;
    }) => Promise<{ success: boolean; error?: string }>;
    selectAuth: (index: number) => Promise<{ success: boolean; error?: string }>;
    clearAuth: (index: number) => Promise<{ success: boolean; error?: string }>;
    clearAllAuth: () => Promise<{ success: boolean; error?: string }>;
    listSolutions: () => Promise<DeployedSolution[]>;
    deploy: (options: DeploymentOptions) => Promise<ImportResult>;
    getDeployments: () => Promise<DeploymentRecord[]>;
    saveDeployment: (deployment: DeploymentRecord) => Promise<{ success: boolean }>;
    clearDeployments: () => Promise<{ success: boolean }>;
  };
  template: {
    getAll: () => Promise<ControlTemplate[]>;
    get: (templateId: string) => Promise<ControlTemplate | null>;
    createFrom: (options: TemplateCreateOptions) => Promise<{ success: boolean; error?: string; projectPath?: string }>;
  };
  localization: {
    loadProject: (projectPath: string) => Promise<LocalizationProject | null>;
    addEntry: (basePath: string, entry: LocalizationEntry) => Promise<{ success: boolean; error?: string }>;
    updateEntry: (basePath: string, key: string, values: Record<string, string>, comment?: string) => Promise<{ success: boolean; error?: string }>;
    deleteEntry: (basePath: string, key: string) => Promise<{ success: boolean; error?: string }>;
    addLanguage: (basePath: string, languageCode: string, copyFromLanguage?: string) => Promise<{ success: boolean; error?: string }>;
    exportCsv: (basePath: string, outputPath: string, options: LocalizationExportOptions) => Promise<{ success: boolean; error?: string }>;
    importCsv: (basePath: string, csvPath: string) => Promise<LocalizationImportResult>;
    getMissing: (basePath: string) => Promise<{ key: string; missingLanguages: string[] }[]>;
  };
  git: {
    isRepo: (projectPath: string) => Promise<boolean>;
    status: (projectPath: string) => Promise<GitStatus>;
    branches: (projectPath: string) => Promise<GitBranch[]>;
    commits: (projectPath: string, limit?: number) => Promise<GitCommit[]>;
    stage: (projectPath: string, files?: string[]) => Promise<{ success: boolean; error?: string }>;
    unstage: (projectPath: string, files?: string[]) => Promise<{ success: boolean; error?: string }>;
    commit: (projectPath: string, options: GitCommitOptions) => Promise<{ success: boolean; error?: string }>;
    push: (projectPath: string, options?: GitPushOptions) => Promise<{ success: boolean; error?: string }>;
    pull: (projectPath: string, options?: GitPullOptions) => Promise<{ success: boolean; error?: string }>;
    checkout: (projectPath: string, branch: string) => Promise<{ success: boolean; error?: string }>;
    createBranch: (projectPath: string, branchName: string, checkout?: boolean) => Promise<{ success: boolean; error?: string }>;
    init: (projectPath: string) => Promise<{ success: boolean; error?: string }>;
    generateMessage: (projectPath: string) => Promise<string>;
  };
  tools: {
    generateDocs: (input: DocGeneratorInput) => Promise<GeneratedDoc>;
    analyzeBundle: (projectPath: string) => Promise<BundleAnalysis>;
    bundleHistory: (projectPath: string) => Promise<BundleSizeHistory>;
    recordBundleSize: (projectPath: string, entry: BundleSizeEntry) => Promise<{ success: boolean }>;
    diffSolutions: (input: SolutionDiffInput) => Promise<SolutionDiffResult>;
    diffReport: (result: SolutionDiffResult) => Promise<string>;
    selectZip: () => Promise<string | null>;
    npmAudit: (projectPath: string) => Promise<NpmAuditResult>;
    npmOutdated: (projectPath: string) => Promise<NpmOutdatedResult>;
    npmAuditFix: (projectPath: string) => Promise<{ success: boolean; output: string; error?: string }>;
    npmUpdate: (projectPath: string, packages?: string[]) => Promise<{ success: boolean; output: string; error?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
