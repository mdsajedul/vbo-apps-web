'use client';

import React, { useEffect } from 'react';
import { useBranchStore } from '@/lib/branch-store';
import { BranchSelectModal } from '@/components/pos/BranchSelectModal';

interface BranchRequiredGuardProps {
  children: React.ReactNode;
  featureName?: string;
}

export function BranchRequiredGuard({
  children,
  featureName = 'Point of Sale',
}: BranchRequiredGuardProps) {
  const {
    selectedBranchId,
    branches,
    canSelectAll,
    isLoading,
    isInitialized,
    setBranch,
    fetchAccessibleBranches,
  } = useBranchStore();

  useEffect(() => {
    if (!isInitialized) {
      fetchAccessibleBranches();
    }
  }, [isInitialized, fetchAccessibleBranches]);

  // If user is restricted to a single branch but state is still 'ALL', auto-resolve
  useEffect(() => {
    if (isInitialized && !canSelectAll && selectedBranchId === 'ALL' && branches.length > 0) {
      setBranch(branches[0].id);
    }
  }, [isInitialized, canSelectAll, selectedBranchId, branches, setBranch]);

  // Loading indicator while resolving branch permissions
  if (!isInitialized && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-xs text-slate-400 font-mono">Initializing branch context...</span>
        </div>
      </div>
    );
  }

  // If "ALL" branches is selected for a multi-branch user (Admin/Owner), trigger the Branch Selection Modal
  if (selectedBranchId === 'ALL') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <BranchSelectModal
          open={true}
          allowDismiss={false}
          title={`Select Branch for ${featureName}`}
          description="Operational terminals require an active physical branch. Please select a branch to proceed."
          onBranchSelected={(b) => setBranch(b.id)}
        />
      </div>
    );
  }

  // Branch context is explicitly set to a single branch; render operational application
  return <>{children}</>;
}
