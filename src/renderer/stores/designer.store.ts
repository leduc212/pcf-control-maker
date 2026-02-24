import { create } from 'zustand';
import type {
  DesignerComponent,
  DesignerProperty,
  HistoryEntry,
} from '../../shared/types/designer.types';

interface DesignerState {
  // Manifest info
  manifest: {
    namespace: string;
    constructor: string;
    displayName: string;
    description: string;
  };

  // Properties
  properties: DesignerProperty[];

  // Components on canvas
  components: DesignerComponent[];

  // Selection
  selectedId: string | null;
  hoveredId: string | null;

  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;

  // Actions - Manifest
  setManifest: (manifest: Partial<DesignerState['manifest']>) => void;

  // Actions - Properties
  addProperty: (property: DesignerProperty) => void;
  updateProperty: (name: string, property: Partial<DesignerProperty>) => void;
  removeProperty: (name: string) => void;

  // Actions - Components
  addComponent: (component: DesignerComponent, parentId?: string) => void;
  updateComponent: (id: string, updates: Partial<DesignerComponent>) => void;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, newParentId: string | null, index: number) => void;

  // Actions - Selection
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  saveToHistory: (action: string) => void;

  // Actions - Reset
  reset: () => void;
}

const initialState = {
  manifest: {
    namespace: 'PCFControls',
    constructor: 'MyControl',
    displayName: 'My Control',
    description: '',
  },
  properties: [],
  components: [],
  selectedId: null,
  hoveredId: null,
  history: [],
  historyIndex: -1,
};

export const useDesignerStore = create<DesignerState>((set, get) => ({
  ...initialState,

  setManifest: (manifest) =>
    set((state) => ({
      manifest: { ...state.manifest, ...manifest },
    })),

  addProperty: (property) =>
    set((state) => {
      get().saveToHistory('Add property');
      return { properties: [...state.properties, property] };
    }),

  updateProperty: (name, updates) =>
    set((state) => {
      get().saveToHistory('Update property');
      return {
        properties: state.properties.map((p) =>
          p.name === name ? { ...p, ...updates } : p
        ),
      };
    }),

  removeProperty: (name) =>
    set((state) => {
      get().saveToHistory('Remove property');
      return {
        properties: state.properties.filter((p) => p.name !== name),
      };
    }),

  addComponent: (component, parentId) =>
    set((state) => {
      get().saveToHistory('Add component');

      if (!parentId) {
        return { components: [...state.components, component] };
      }

      const addToParent = (
        components: DesignerComponent[]
      ): DesignerComponent[] => {
        return components.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              children: [...(c.children || []), component],
            };
          }
          if (c.children) {
            return { ...c, children: addToParent(c.children) };
          }
          return c;
        });
      };

      return { components: addToParent(state.components) };
    }),

  updateComponent: (id, updates) =>
    set((state) => {
      get().saveToHistory('Update component');

      const updateInTree = (
        components: DesignerComponent[]
      ): DesignerComponent[] => {
        return components.map((c) => {
          if (c.id === id) {
            return { ...c, ...updates };
          }
          if (c.children) {
            return { ...c, children: updateInTree(c.children) };
          }
          return c;
        });
      };

      return { components: updateInTree(state.components) };
    }),

  removeComponent: (id) =>
    set((state) => {
      get().saveToHistory('Remove component');

      const removeFromTree = (
        components: DesignerComponent[]
      ): DesignerComponent[] => {
        return components
          .filter((c) => c.id !== id)
          .map((c) => {
            if (c.children) {
              return { ...c, children: removeFromTree(c.children) };
            }
            return c;
          });
      };

      return {
        components: removeFromTree(state.components),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  moveComponent: (id, newParentId, index) =>
    set((state) => {
      get().saveToHistory('Move component');

      let movedComponent: DesignerComponent | null = null;

      // First, find and remove the component
      const removeFromTree = (
        components: DesignerComponent[]
      ): DesignerComponent[] => {
        return components
          .filter((c) => {
            if (c.id === id) {
              movedComponent = c;
              return false;
            }
            return true;
          })
          .map((c) => {
            if (c.children) {
              return { ...c, children: removeFromTree(c.children) };
            }
            return c;
          });
      };

      let newComponents = removeFromTree(state.components);

      if (!movedComponent) return state;

      // Then, add it to the new location
      if (!newParentId) {
        newComponents.splice(index, 0, movedComponent);
      } else {
        const addToParent = (
          components: DesignerComponent[]
        ): DesignerComponent[] => {
          return components.map((c) => {
            if (c.id === newParentId) {
              const children = [...(c.children || [])];
              children.splice(index, 0, movedComponent!);
              return { ...c, children };
            }
            if (c.children) {
              return { ...c, children: addToParent(c.children) };
            }
            return c;
          });
        };
        newComponents = addToParent(newComponents);
      }

      return { components: newComponents };
    }),

  setSelectedId: (id) => set({ selectedId: id }),

  setHoveredId: (id) => set({ hoveredId: id }),

  saveToHistory: (action) =>
    set((state) => {
      const entry: HistoryEntry = {
        timestamp: Date.now(),
        action,
        state: {
          components: JSON.parse(JSON.stringify(state.components)),
          properties: JSON.parse(JSON.stringify(state.properties)),
        },
      };

      // Remove any history after current index (for when we've undone and then make a new change)
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(entry);

      // Keep only last 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;

      const newIndex = state.historyIndex - 1;
      const entry = state.history[newIndex];

      return {
        components: JSON.parse(JSON.stringify(entry.state.components)),
        properties: JSON.parse(JSON.stringify(entry.state.properties)),
        historyIndex: newIndex,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const newIndex = state.historyIndex + 1;
      const entry = state.history[newIndex];

      return {
        components: JSON.parse(JSON.stringify(entry.state.components)),
        properties: JSON.parse(JSON.stringify(entry.state.properties)),
        historyIndex: newIndex,
      };
    }),

  reset: () => set(initialState),
}));
