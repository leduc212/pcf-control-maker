import { create } from 'zustand';
import type {
  PCFManifest,
  ManifestProperty,
  ManifestResource,
  ManifestTypeGroup,
  ManifestHistoryEntry,
  ManifestFeatureUsage,
  PCFPlatformLibraryName,
} from '../../shared/types/manifest.types';
import { DEFAULT_MANIFEST } from '../../shared/constants/manifest.constants';

interface ManifestState {
  // Current manifest
  manifest: PCFManifest;

  // Selection
  selectedPropertyId: string | null;
  selectedResourceId: string | null;

  // Dirty tracking
  isDirty: boolean;

  // History for undo/redo
  history: ManifestHistoryEntry[];
  historyIndex: number;

  // Actions - Control
  setControlInfo: (info: Partial<PCFManifest['control']>) => void;

  // Actions - Properties
  addProperty: (property: ManifestProperty) => void;
  updateProperty: (id: string, updates: Partial<ManifestProperty>) => void;
  removeProperty: (id: string) => void;
  reorderProperties: (fromIndex: number, toIndex: number) => void;

  // Actions - Type Groups
  addTypeGroup: (group: ManifestTypeGroup) => void;
  updateTypeGroup: (id: string, updates: Partial<ManifestTypeGroup>) => void;
  removeTypeGroup: (id: string) => void;

  // Actions - Resources
  addResource: (resource: ManifestResource) => void;
  updateResource: (id: string, updates: Partial<ManifestResource>) => void;
  removeResource: (id: string) => void;

  // Actions - Platform Libraries
  togglePlatformLibrary: (libraryName: PCFPlatformLibraryName) => void;
  updatePlatformLibraryVersion: (libraryName: PCFPlatformLibraryName, version: string) => void;

  // Actions - Feature Usage
  setFeatureUsage: (features: Partial<ManifestFeatureUsage>) => void;

  // Actions - Selection
  setSelectedPropertyId: (id: string | null) => void;
  setSelectedResourceId: (id: string | null) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  saveToHistory: (action: string) => void;

  // Actions - Load/Reset
  loadManifest: (manifest: PCFManifest) => void;
  reset: () => void;

  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useManifestStore = create<ManifestState>((set, get) => ({
  manifest: JSON.parse(JSON.stringify(DEFAULT_MANIFEST)),
  selectedPropertyId: null,
  selectedResourceId: null,
  isDirty: false,
  history: [],
  historyIndex: -1,

  setControlInfo: (info) => {
    get().saveToHistory('Update control info');
    set((state) => ({
      manifest: {
        ...state.manifest,
        control: { ...state.manifest.control, ...info },
      },
      isDirty: true,
    }));
  },

  addProperty: (property) => {
    get().saveToHistory('Add property');
    set((state) => ({
      manifest: {
        ...state.manifest,
        properties: [...state.manifest.properties, { ...property, id: property.id || generateId() }],
      },
      isDirty: true,
    }));
  },

  updateProperty: (id, updates) => {
    get().saveToHistory('Update property');
    set((state) => ({
      manifest: {
        ...state.manifest,
        properties: state.manifest.properties.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
      isDirty: true,
    }));
  },

  removeProperty: (id) => {
    get().saveToHistory('Remove property');
    set((state) => ({
      manifest: {
        ...state.manifest,
        properties: state.manifest.properties.filter((p) => p.id !== id),
      },
      selectedPropertyId: state.selectedPropertyId === id ? null : state.selectedPropertyId,
      isDirty: true,
    }));
  },

  reorderProperties: (fromIndex, toIndex) => {
    get().saveToHistory('Reorder properties');
    set((state) => {
      const properties = [...state.manifest.properties];
      const [removed] = properties.splice(fromIndex, 1);
      properties.splice(toIndex, 0, removed);
      return {
        manifest: { ...state.manifest, properties },
        isDirty: true,
      };
    });
  },

  addTypeGroup: (group) => {
    get().saveToHistory('Add type group');
    set((state) => ({
      manifest: {
        ...state.manifest,
        typeGroups: [...state.manifest.typeGroups, { ...group, id: group.id || generateId() }],
      },
      isDirty: true,
    }));
  },

  updateTypeGroup: (id, updates) => {
    get().saveToHistory('Update type group');
    set((state) => ({
      manifest: {
        ...state.manifest,
        typeGroups: state.manifest.typeGroups.map((g) =>
          g.id === id ? { ...g, ...updates } : g
        ),
      },
      isDirty: true,
    }));
  },

  removeTypeGroup: (id) => {
    get().saveToHistory('Remove type group');
    set((state) => ({
      manifest: {
        ...state.manifest,
        typeGroups: state.manifest.typeGroups.filter((g) => g.id !== id),
      },
      isDirty: true,
    }));
  },

  addResource: (resource) => {
    get().saveToHistory('Add resource');
    set((state) => ({
      manifest: {
        ...state.manifest,
        resources: [...state.manifest.resources, { ...resource, id: resource.id || generateId() }],
      },
      isDirty: true,
    }));
  },

  updateResource: (id, updates) => {
    get().saveToHistory('Update resource');
    set((state) => ({
      manifest: {
        ...state.manifest,
        resources: state.manifest.resources.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      },
      isDirty: true,
    }));
  },

  removeResource: (id) => {
    get().saveToHistory('Remove resource');
    set((state) => ({
      manifest: {
        ...state.manifest,
        resources: state.manifest.resources.filter((r) => r.id !== id),
      },
      selectedResourceId: state.selectedResourceId === id ? null : state.selectedResourceId,
      isDirty: true,
    }));
  },

  togglePlatformLibrary: (libraryName) => {
    get().saveToHistory('Toggle platform library');
    set((state) => ({
      manifest: {
        ...state.manifest,
        platformLibraries: state.manifest.platformLibraries.map((lib) =>
          lib.name === libraryName ? { ...lib, enabled: !lib.enabled } : lib
        ),
      },
      isDirty: true,
    }));
  },

  updatePlatformLibraryVersion: (libraryName, version) => {
    get().saveToHistory('Update platform library version');
    set((state) => ({
      manifest: {
        ...state.manifest,
        platformLibraries: state.manifest.platformLibraries.map((lib) =>
          lib.name === libraryName ? { ...lib, version } : lib
        ),
      },
      isDirty: true,
    }));
  },

  setFeatureUsage: (features) => {
    get().saveToHistory('Update feature usage');
    set((state) => ({
      manifest: {
        ...state.manifest,
        featureUsage: { ...state.manifest.featureUsage, ...features },
      },
      isDirty: true,
    }));
  },

  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  setSelectedResourceId: (id) => set({ selectedResourceId: id }),

  saveToHistory: (action) => {
    const state = get();
    const entry: ManifestHistoryEntry = {
      timestamp: Date.now(),
      action,
      manifest: JSON.parse(JSON.stringify(state.manifest)),
    };

    // Remove any history after current index
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(entry);

    // Keep only last 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;

    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];

    set({
      manifest: JSON.parse(JSON.stringify(entry.manifest)),
      historyIndex: newIndex,
      isDirty: true,
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];

    set({
      manifest: JSON.parse(JSON.stringify(entry.manifest)),
      historyIndex: newIndex,
      isDirty: true,
    });
  },

  loadManifest: (manifest) => {
    set({
      manifest: JSON.parse(JSON.stringify(manifest)),
      history: [],
      historyIndex: -1,
      isDirty: false,
      selectedPropertyId: null,
      selectedResourceId: null,
    });
  },

  reset: () => {
    set({
      manifest: JSON.parse(JSON.stringify(DEFAULT_MANIFEST)),
      history: [],
      historyIndex: -1,
      isDirty: false,
      selectedPropertyId: null,
      selectedResourceId: null,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));
