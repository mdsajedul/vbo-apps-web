'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBranchStore } from '@/lib/branch-store';
import { BranchSelectModal } from './BranchSelectModal';
import { MapPin, ChevronsUpDown, Lock, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PosBranchSwitcherProps {
  activeShift?: any | null;
  onBranchChanged?: (newBranchId: string) => void;
  className?: string;
}

export function PosBranchSwitcher({
  activeShift,
  onBranchChanged,
  className = '',
}: PosBranchSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { branches, selectedBranchId, selectedBranch, canSelectAll, setBranch } = useBranchStore();
  const [showModal, setShowModal] = useState(false);
  const [showShiftWarning, setShowShiftWarning] = useState(false);
  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null);

  const activeBranch = selectedBranch || branches.find((b) => b.id === selectedBranchId) || branches[0];
  const isMultiBranchAllowed = canSelectAll && branches.length > 1;

  const handleOpenSwitch = () => {
    if (!isMultiBranchAllowed) return;
    setShowModal(true);
  };

  const handleBranchSelected = (b: any) => {
    if (b.id === selectedBranchId) {
      setShowModal(false);
      return;
    }

    // If an active shift is open, confirm with the user before switching
    if (activeShift) {
      setPendingBranchId(b.id);
      setShowShiftWarning(true);
      setShowModal(false);
      return;
    }

    commitBranchSwitch(b.id);
  };

  const commitBranchSwitch = (branchId: string) => {
    setBranch(branchId);
    if (onBranchChanged) {
      onBranchChanged(branchId);
    }
    setShowModal(false);
    setShowShiftWarning(false);
    setPendingBranchId(null);

    const targetBranch = branches.find((b) => b.id === branchId);
    const targetVertical =
      targetBranch?.industry_type ||
      (targetBranch as any)?.organization?.default_industry_type;

    if (targetVertical === 'RESTAURANT' && pathname?.startsWith('/pos/retail')) {
      router.push('/pos/restaurant');
    } else if (targetVertical === 'RETAIL' && pathname?.startsWith('/pos/restaurant')) {
      router.push('/pos/retail');
    }
  };

  // Single-branch restricted staff view
  if (!isMultiBranchAllowed) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-200 shadow-xs ${className}`}
        title={`Assigned to ${activeBranch?.name || 'Branch'}`}
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="truncate max-w-[120px]">{activeBranch?.name || 'Assigned Branch'}</span>
        {activeBranch?.code && (
          <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 px-1 py-0.2 rounded font-bold uppercase">
            {activeBranch.code}
          </span>
        )}
        <span title="Branch assigned by admin" className="inline-flex items-center">
          <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
        </span>
      </div>
    );
  }

  // Multi-branch user interactive switcher
  return (
    <>
      <button
        type="button"
        onClick={handleOpenSwitch}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 hover:border-blue-500/50 text-xs font-semibold text-white transition-all shadow-xs cursor-pointer group ${className}`}
        title="Switch POS Branch Location"
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:text-blue-400 transition-colors shrink-0" />
        <span className="truncate max-w-[130px]">{activeBranch?.name || 'Select Branch'}</span>
        {activeBranch?.code && (
          <span className="text-[10px] font-mono bg-slate-700 text-slate-300 group-hover:bg-blue-500/20 group-hover:text-blue-300 px-1 py-0.2 rounded font-bold uppercase transition-colors">
            {activeBranch.code}
          </span>
        )}
        <ChevronsUpDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-0.5" />
      </button>

      {/* Branch Selection Modal */}
      <BranchSelectModal
        open={showModal}
        onOpenChange={setShowModal}
        allowDismiss={true}
        title="Switch POS Branch"
        description="Select an active location to switch POS register, inventory, and shift context."
        onBranchSelected={handleBranchSelected}
      />

      {/* Active Shift Warning Confirmation */}
      <AlertDialog open={showShiftWarning} onOpenChange={setShowShiftWarning}>
        <AlertDialogContent className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-md">
          <AlertDialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-white">
              Active Register Shift Open
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-300">
              You currently have an active shift open for{' '}
              <span className="font-bold text-emerald-400">{activeBranch?.name}</span>. Switching to
              another branch will reload register context.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowShiftWarning(false);
                setPendingBranchId(null);
              }}
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white text-xs"
            >
              Keep Current Branch
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingBranchId) {
                  commitBranchSwitch(pendingBranchId);
                }
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              Proceed with Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
