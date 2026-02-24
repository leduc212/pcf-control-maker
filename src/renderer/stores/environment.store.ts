import { create } from 'zustand';
import type {
  EnvironmentProfile,
  AuthStatus,
  DeploymentRecord,
  PacAuthProfile,
} from '../../shared/types/environment.types';

interface EnvironmentState {
  // Environment profiles
  profiles: EnvironmentProfile[];
  selectedProfileId: string | null;

  // Auth status
  authStatus: AuthStatus;
  isAuthLoading: boolean;

  // Deployments
  deployments: DeploymentRecord[];
  activeDeployment: DeploymentRecord | null;

  // Actions - Profiles
  setProfiles: (profiles: EnvironmentProfile[]) => void;
  setSelectedProfileId: (id: string | null) => void;
  loadProfiles: () => Promise<void>;
  addProfile: (profile: Omit<EnvironmentProfile, 'id' | 'createdAt'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<EnvironmentProfile>) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  setDefaultProfile: (id: string) => Promise<void>;
  selectProfile: (id: string | null) => void;

  // Actions - Auth
  setAuthStatus: (status: AuthStatus) => void;
  setAuthLoading: (loading: boolean) => void;
  checkAuthStatus: () => Promise<void>;
  authenticate: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  selectAuth: (index: number) => Promise<{ success: boolean; error?: string }>;
  clearAuth: (index: number) => Promise<{ success: boolean; error?: string }>;

  // Actions - Deployments
  loadDeployments: () => Promise<void>;
  addDeployment: (deployment: DeploymentRecord) => void;
  updateDeployment: (id: string, updates: Partial<DeploymentRecord>) => void;
  clearDeployments: () => void;
}

const generateId = () => `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  profiles: [],
  selectedProfileId: null,
  authStatus: {
    isAuthenticated: false,
    profiles: [],
    lastChecked: 0,
  },
  isAuthLoading: false,
  deployments: [],
  activeDeployment: null,

  setProfiles: (profiles) => set({ profiles }),
  setSelectedProfileId: (id) => set({ selectedProfileId: id }),
  setAuthStatus: (authStatus) => set({ authStatus }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

  loadProfiles: async () => {
    try {
      const profiles = await window.electronAPI.environment.getProfiles();
      set({ profiles });

      // Select default profile if none selected
      const defaultProfile = profiles.find(p => p.isDefault);
      if (defaultProfile && !get().selectedProfileId) {
        set({ selectedProfileId: defaultProfile.id });
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  },

  addProfile: async (profile) => {
    const newProfile: EnvironmentProfile = {
      ...profile,
      id: generateId(),
      createdAt: Date.now(),
    };

    try {
      await window.electronAPI.environment.saveProfile(newProfile);
      set((state) => ({
        profiles: [...state.profiles, newProfile],
      }));
    } catch (error) {
      console.error('Failed to add profile:', error);
      throw error;
    }
  },

  updateProfile: async (id, updates) => {
    const profile = get().profiles.find(p => p.id === id);
    if (!profile) return;

    const updatedProfile = { ...profile, ...updates };

    try {
      await window.electronAPI.environment.saveProfile(updatedProfile);
      set((state) => ({
        profiles: state.profiles.map(p => p.id === id ? updatedProfile : p),
      }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  removeProfile: async (id) => {
    try {
      await window.electronAPI.environment.deleteProfile(id);
      set((state) => ({
        profiles: state.profiles.filter(p => p.id !== id),
        selectedProfileId: state.selectedProfileId === id ? null : state.selectedProfileId,
      }));
    } catch (error) {
      console.error('Failed to remove profile:', error);
      throw error;
    }
  },

  setDefaultProfile: async (id) => {
    const profiles = get().profiles.map(p => ({
      ...p,
      isDefault: p.id === id,
    }));

    try {
      for (const profile of profiles) {
        await window.electronAPI.environment.saveProfile(profile);
      }
      set({ profiles });
    } catch (error) {
      console.error('Failed to set default profile:', error);
      throw error;
    }
  },

  selectProfile: (id) => {
    set({ selectedProfileId: id });
  },

  checkAuthStatus: async () => {
    set({ isAuthLoading: true });

    try {
      const result = await window.electronAPI.environment.getAuthStatus();
      set({
        authStatus: {
          isAuthenticated: result.profiles.some(p => p.active),
          currentProfile: result.profiles.find(p => p.active),
          profiles: result.profiles,
          lastChecked: Date.now(),
        },
        isAuthLoading: false,
      });
    } catch (error) {
      console.error('Failed to check auth status:', error);
      set({
        authStatus: {
          isAuthenticated: false,
          profiles: [],
          lastChecked: Date.now(),
        },
        isAuthLoading: false,
      });
    }
  },

  authenticate: async (profileId) => {
    const profile = get().profiles.find(p => p.id === profileId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    try {
      const result = await window.electronAPI.environment.authenticate({
        url: profile.url,
        authenticationType: profile.authenticationType,
        tenantId: profile.tenantId,
        clientId: profile.clientId,
      });

      if (result.success) {
        // Update last used timestamp
        await get().updateProfile(profileId, { lastUsedAt: Date.now() });
        // Refresh auth status
        await get().checkAuthStatus();
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  selectAuth: async (index) => {
    try {
      const result = await window.electronAPI.environment.selectAuth(index);
      if (result.success) {
        await get().checkAuthStatus();
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  clearAuth: async (index) => {
    try {
      const result = await window.electronAPI.environment.clearAuth(index);
      if (result.success) {
        await get().checkAuthStatus();
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  loadDeployments: async () => {
    try {
      const deployments = await window.electronAPI.environment.getDeployments();
      set({ deployments });
    } catch (error) {
      console.error('Failed to load deployments:', error);
    }
  },

  addDeployment: (deployment) => {
    set((state) => ({
      deployments: [deployment, ...state.deployments],
      activeDeployment: deployment,
    }));
    // Persist
    window.electronAPI.environment.saveDeployment(deployment).catch(console.error);
  },

  updateDeployment: (id, updates) => {
    set((state) => {
      const deployments = state.deployments.map(d =>
        d.id === id ? { ...d, ...updates } : d
      );
      const activeDeployment = state.activeDeployment?.id === id
        ? { ...state.activeDeployment, ...updates }
        : state.activeDeployment;

      // Persist
      const updated = deployments.find(d => d.id === id);
      if (updated) {
        window.electronAPI.environment.saveDeployment(updated).catch(console.error);
      }

      return { deployments, activeDeployment };
    });
  },

  clearDeployments: () => {
    set({ deployments: [], activeDeployment: null });
  },
}));
