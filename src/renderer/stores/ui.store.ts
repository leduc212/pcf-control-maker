import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface PacCliStatus {
  checked: boolean;
  installed: boolean;
  message: string;
  dismissed: boolean;
}

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  notifications: Notification[];
  pacCliStatus: PacCliStatus;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setPacCliStatus: (status: Partial<PacCliStatus>) => void;
  dismissPacCliWarning: () => void;
  checkPacCli: () => Promise<void>;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  sidebarCollapsed: false,
  activeModal: null,
  notifications: [],
  pacCliStatus: {
    checked: false,
    installed: false,
    message: '',
    dismissed: false,
  },

  setTheme: (theme) => set({ theme }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  openModal: (modalId) => set({ activeModal: modalId }),

  closeModal: () => set({ activeModal: null }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: crypto.randomUUID() },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setPacCliStatus: (status) =>
    set((state) => ({
      pacCliStatus: { ...state.pacCliStatus, ...status },
    })),

  dismissPacCliWarning: () =>
    set((state) => ({
      pacCliStatus: { ...state.pacCliStatus, dismissed: true },
    })),

  checkPacCli: async () => {
    try {
      const result = await window.electronAPI.pac.checkInstallation();
      set({
        pacCliStatus: {
          checked: true,
          installed: result.installed,
          message: result.message,
          dismissed: get().pacCliStatus.dismissed,
        },
      });
    } catch (error) {
      set({
        pacCliStatus: {
          checked: true,
          installed: false,
          message: 'Failed to check PAC CLI installation',
          dismissed: get().pacCliStatus.dismissed,
        },
      });
    }
  },
}));
