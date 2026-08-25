import { create } from 'zustand';

interface AppState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  notificationsCount: number;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setNotificationsCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  notificationsCount: 0,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleMobileSidebar: () => set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),
  setNotificationsCount: (count) => set({ notificationsCount: count }),
}));
