import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  /** Whether the desktop sidebar is in collapsed (icon-only rail) mode */
  isCollapsed: boolean;
  /** Toggle between expanded and collapsed */
  toggleCollapsed: () => void;
  /** Explicitly set collapsed state */
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,

      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),

      setCollapsed: (collapsed: boolean) =>
        set({ isCollapsed: collapsed }),
    }),
    {
      name: 'bos-sidebar-state',
    }
  )
);
