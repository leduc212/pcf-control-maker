import { create } from 'zustand';
import type {
  GeneratedDoc,
  BundleAnalysis,
  BundleSizeHistory,
  SolutionDiffResult,
  NpmAuditResult,
  NpmOutdatedResult,
} from '../../shared/types/tools.types';

interface ToolsState {
  // Documentation Generator
  docsLoading: boolean;
  docsResult: GeneratedDoc | null;
  docsError: string | null;

  // Bundle Analyzer
  bundleLoading: boolean;
  bundleResult: BundleAnalysis | null;
  bundleHistory: BundleSizeHistory | null;
  bundleError: string | null;

  // Solution Diff
  diffLoading: boolean;
  diffResult: SolutionDiffResult | null;
  diffError: string | null;

  // Dependency Management
  auditLoading: boolean;
  auditResult: NpmAuditResult | null;
  auditError: string | null;
  outdatedLoading: boolean;
  outdatedResult: NpmOutdatedResult | null;
  outdatedError: string | null;
  fixLoading: boolean;

  // Actions
  generateDocs: (projectPath: string, manifestPath: string, includeChangelog: boolean, includeUsageExamples: boolean) => Promise<void>;
  analyzeBundle: (projectPath: string) => Promise<void>;
  loadBundleHistory: (projectPath: string) => Promise<void>;
  recordBundleSize: (projectPath: string) => Promise<void>;
  diffSolutions: (zipPathA: string, zipPathB: string) => Promise<void>;
  runAudit: (projectPath: string) => Promise<void>;
  runOutdated: (projectPath: string) => Promise<void>;
  runAuditFix: (projectPath: string) => Promise<{ success: boolean; error?: string }>;
  runUpdate: (projectPath: string, packages?: string[]) => Promise<{ success: boolean; error?: string }>;
  selectZip: () => Promise<string | null>;
  getDiffReport: () => Promise<string | null>;
  clearDocsResult: () => void;
  clearDiffResult: () => void;
}

export const useToolsStore = create<ToolsState>((set, get) => ({
  docsLoading: false,
  docsResult: null,
  docsError: null,

  bundleLoading: false,
  bundleResult: null,
  bundleHistory: null,
  bundleError: null,

  diffLoading: false,
  diffResult: null,
  diffError: null,

  auditLoading: false,
  auditResult: null,
  auditError: null,
  outdatedLoading: false,
  outdatedResult: null,
  outdatedError: null,
  fixLoading: false,

  generateDocs: async (projectPath, manifestPath, includeChangelog, includeUsageExamples) => {
    set({ docsLoading: true, docsError: null });
    try {
      const result = await window.electronAPI.tools.generateDocs({
        projectPath,
        manifestPath,
        includeChangelog,
        includeUsageExamples,
      });
      set({ docsResult: result, docsLoading: false });
    } catch (error) {
      set({ docsError: (error as Error).message, docsLoading: false });
    }
  },

  analyzeBundle: async (projectPath) => {
    set({ bundleLoading: true, bundleError: null });
    try {
      const result = await window.electronAPI.tools.analyzeBundle(projectPath);
      set({ bundleResult: result, bundleLoading: false });
    } catch (error) {
      set({ bundleError: (error as Error).message, bundleLoading: false });
    }
  },

  loadBundleHistory: async (projectPath) => {
    try {
      const history = await window.electronAPI.tools.bundleHistory(projectPath);
      set({ bundleHistory: history });
    } catch (error) {
      console.error('Failed to load bundle history:', error);
    }
  },

  recordBundleSize: async (projectPath) => {
    const { bundleResult } = get();
    if (!bundleResult || bundleResult.bundleSizeBytes === 0) return;

    try {
      await window.electronAPI.tools.recordBundleSize(projectPath, {
        sizeBytes: bundleResult.bundleSizeBytes,
        dependencyCount: bundleResult.dependencyCount,
        timestamp: Date.now(),
      });
      // Reload history
      await get().loadBundleHistory(projectPath);
    } catch (error) {
      console.error('Failed to record bundle size:', error);
    }
  },

  diffSolutions: async (zipPathA, zipPathB) => {
    set({ diffLoading: true, diffError: null });
    try {
      const result = await window.electronAPI.tools.diffSolutions({ zipPathA, zipPathB });
      set({ diffResult: result, diffLoading: false });
    } catch (error) {
      set({ diffError: (error as Error).message, diffLoading: false });
    }
  },

  runAudit: async (projectPath) => {
    set({ auditLoading: true, auditError: null });
    try {
      const result = await window.electronAPI.tools.npmAudit(projectPath);
      set({ auditResult: result, auditLoading: false });
    } catch (error) {
      set({ auditError: (error as Error).message, auditLoading: false });
    }
  },

  runOutdated: async (projectPath) => {
    set({ outdatedLoading: true, outdatedError: null });
    try {
      const result = await window.electronAPI.tools.npmOutdated(projectPath);
      set({ outdatedResult: result, outdatedLoading: false });
    } catch (error) {
      set({ outdatedError: (error as Error).message, outdatedLoading: false });
    }
  },

  runAuditFix: async (projectPath) => {
    set({ fixLoading: true });
    try {
      const result = await window.electronAPI.tools.npmAuditFix(projectPath);
      set({ fixLoading: false });
      if (result.success) {
        // Refresh audit results
        await get().runAudit(projectPath);
      }
      return { success: result.success, error: result.error };
    } catch (error) {
      set({ fixLoading: false });
      return { success: false, error: (error as Error).message };
    }
  },

  runUpdate: async (projectPath, packages) => {
    set({ fixLoading: true });
    try {
      const result = await window.electronAPI.tools.npmUpdate(projectPath, packages);
      set({ fixLoading: false });
      if (result.success) {
        await get().runOutdated(projectPath);
      }
      return { success: result.success, error: result.error };
    } catch (error) {
      set({ fixLoading: false });
      return { success: false, error: (error as Error).message };
    }
  },

  selectZip: async () => {
    return window.electronAPI.tools.selectZip();
  },

  getDiffReport: async () => {
    const { diffResult } = get();
    if (!diffResult) return null;
    return window.electronAPI.tools.diffReport(diffResult);
  },

  clearDocsResult: () => set({ docsResult: null, docsError: null }),
  clearDiffResult: () => set({ diffResult: null, diffError: null }),
}));
