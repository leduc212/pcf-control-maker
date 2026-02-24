import { create } from 'zustand';
import type { PcfProject, ProjectValidation } from '../../shared/types/project.types';

interface ProjectState {
  currentProject: PcfProject | null;
  recentProjects: string[];
  isLoading: boolean;
  error: string | null;
  validation: ProjectValidation | null;

  // Actions
  setCurrentProject: (project: PcfProject | null) => void;
  setRecentProjects: (projects: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setValidation: (validation: ProjectValidation | null) => void;

  // Async actions
  openProject: (projectPath: string) => Promise<void>;
  loadRecentProjects: () => Promise<void>;
  createProject: (options: CreateProjectOptions) => Promise<boolean>;
}

interface CreateProjectOptions {
  name: string;
  namespace: string;
  template: 'field' | 'dataset';
  framework?: 'none' | 'react';
  outputDirectory: string;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  recentProjects: [],
  isLoading: false,
  error: null,
  validation: null,

  setCurrentProject: (project) => set({ currentProject: project }),
  setRecentProjects: (projects) => set({ recentProjects: projects }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setValidation: (validation) => set({ validation }),

  openProject: async (projectPath: string) => {
    set({ isLoading: true, error: null });

    try {
      const project = await window.electronAPI.project.open(projectPath);
      if (project) {
        set({ currentProject: project as PcfProject });
        await get().loadRecentProjects();
      } else {
        set({ error: 'Failed to open project. Make sure it is a valid PCF project.' });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadRecentProjects: async () => {
    try {
      const projects = await window.electronAPI.project.getRecent();
      set({ recentProjects: projects });
    } catch (error) {
      console.error('Failed to load recent projects:', error);
    }
  },

  createProject: async (options: CreateProjectOptions) => {
    set({ isLoading: true, error: null });

    try {
      const result = await window.electronAPI.pac.pcfInit({
        name: options.name,
        namespace: options.namespace,
        template: options.template,
        framework: options.framework,
        outputDirectory: options.outputDirectory,
        runNpmInstall: true,
      });

      if ((result as { success: boolean }).success) {
        await get().openProject(options.outputDirectory);
        return true;
      } else {
        set({ error: (result as { stderr: string }).stderr || 'Failed to create project' });
        return false;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
