import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
}

export interface AppState {
  // UI & Layout Slices
  isSidebarOpen: boolean;
  isAuthHeaderHidden: boolean;
  activeModal: string | null;
  modalPayload: unknown | null;
  notifications: NotificationItem[];
  
  // User Preferences Slice
  theme: 'light' | 'dark' | 'system';
}

export interface AppActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setAuthHeaderHidden: (hidden: boolean) => void;

  // Modal actions
  openModal: (modalId: string, payload?: unknown) => void;
  closeModal: () => void;

  // Notifications
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Reset Store
  resetStore: () => void;
}

const initialState: AppState = {
  isSidebarOpen: false,
  isAuthHeaderHidden: false,
  activeModal: null,
  modalPayload: null,
  notifications: [],
  theme: 'system',
};

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
        setAuthHeaderHidden: (isAuthHeaderHidden) => set({ isAuthHeaderHidden }),

        openModal: (activeModal, modalPayload = null) => set({ activeModal, modalPayload }),
        closeModal: () => set({ activeModal: null, modalPayload: null }),

        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              ...state.notifications,
              {
                ...notification,
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                timestamp: Date.now(),
              },
            ],
          })),

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),

        clearNotifications: () => set({ notifications: [] }),

        setTheme: (theme) => set({ theme }),

        resetStore: () => set(initialState),
      }),
      {
        name: 'vinfo-app-store',
        storage: createJSONStorage(() => localStorage),
        // Persist only user preferences, not transient UI states like open modals
        partialize: (state) => ({
          theme: state.theme,
          isSidebarOpen: state.isSidebarOpen,
        }),
      }
    ),
    { name: 'VinfoStore' }
  )
);
