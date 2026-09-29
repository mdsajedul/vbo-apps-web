import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { branchesApi } from './api';

export interface Branch {
  id: string;
  name: string;
  code: string;
  industry_type?: string | null;
  is_active: boolean;
  organization_id?: string;
  timezone?: string;
}

interface AccessibleBranchesResponse {
  branches: Branch[];
  canSelectAll: boolean;
  defaultBranchId: string | 'ALL';
}

interface BranchState {
  selectedBranchId: string | 'ALL';
  selectedBranch: Branch | null;
  branches: Branch[];
  canSelectAll: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setBranch: (branchId: string | 'ALL') => void;
  fetchAccessibleBranches: () => Promise<void>;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      selectedBranchId: 'ALL',
      selectedBranch: null,
      branches: [],
      canSelectAll: true,
      isLoading: false,
      isInitialized: false,

      setBranch: (branchId: string | 'ALL') => {
        const branches = get().branches;
        if (branchId === 'ALL') {
          if (!get().canSelectAll) return; // Prevent unauthorized selection
          set({ selectedBranchId: 'ALL', selectedBranch: null });
        } else {
          const found = branches.find((b) => b.id === branchId) || null;
          set({ selectedBranchId: branchId, selectedBranch: found });
        }
      },

      fetchAccessibleBranches: async () => {
        set({ isLoading: true });
        try {
          const res: AccessibleBranchesResponse = await branchesApi.getAccessible();
          const branches = res?.branches || [];
          const canSelectAll = res?.canSelectAll ?? true;
          const defaultBranchId = res?.defaultBranchId || 'ALL';

          const currentSelected = get().selectedBranchId;
          let newSelected = currentSelected;

          // If user cannot select all branches, force single branch
          if (!canSelectAll) {
            if (currentSelected === 'ALL' || !branches.some((b) => b.id === currentSelected)) {
              newSelected = defaultBranchId !== 'ALL' ? defaultBranchId : (branches[0]?.id || 'ALL');
            }
          } else {
            // If currently selected branch no longer exists, fallback
            if (currentSelected !== 'ALL' && !branches.some((b) => b.id === currentSelected)) {
              newSelected = 'ALL';
            }
          }

          const activeBranch =
            newSelected !== 'ALL'
              ? branches.find((b) => b.id === newSelected) || null
              : null;

          set({
            branches,
            canSelectAll,
            selectedBranchId: newSelected,
            selectedBranch: activeBranch,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Failed to load accessible branches:', error);
          set({ isLoading: false, isInitialized: true });
        }
      },
    }),
    {
      name: 'bos-branch-storage',
      partialize: (state) => ({ selectedBranchId: state.selectedBranchId }),
    }
  )
);
