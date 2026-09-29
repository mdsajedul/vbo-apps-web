'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBranchStore, Branch } from '@/lib/branch-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MapPin, Building2, ArrowRight, ArrowLeft, Search, Check } from 'lucide-react';

interface BranchSelectModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onBranchSelected?: (branch: Branch) => void;
  title?: string;
  description?: string;
  allowDismiss?: boolean;
}

export function BranchSelectModal({
  open,
  onOpenChange,
  onBranchSelected,
  title = 'Select POS Branch',
  description = 'Point of Sale operations require an active physical branch register.',
  allowDismiss = false,
}: BranchSelectModalProps) {
  const router = useRouter();
  const { branches, selectedBranchId, setBranch, fetchAccessibleBranches } = useBranchStore();
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (open) {
      fetchAccessibleBranches().catch(() => null);
    }
  }, [open, fetchAccessibleBranches]);

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (branch: Branch) => {
    setBranch(branch.id);
    if (onBranchSelected) {
      onBranchSelected(branch);
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !allowDismiss) {
          // If forced, do not dismiss on click outside unless explicitly allowed
          return;
        }
        if (onOpenChange) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        className="max-w-md w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 focus:outline-none"
        // Prevent closing on escape key if allowDismiss is false
        onEscapeKeyDown={(e) => {
          if (!allowDismiss) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!allowDismiss) e.preventDefault();
        }}
      >
        <DialogHeader className="space-y-3 text-center sm:text-center">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {description}
          </DialogDescription>
        </DialogHeader>

        {branches.length > 4 && (
          <div className="relative my-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search accessible branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}

        <div className="space-y-2 mt-2 max-h-72 overflow-y-auto pr-1">
          {filteredBranches.map((b) => {
            const isSelected = selectedBranchId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => handleSelect(b)}
                type="button"
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group text-left ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-colors'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {b.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {b.code && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 py-0.2 rounded uppercase">
                          {b.code}
                        </span>
                      )}
                      {b.industry_type && (
                        <span className="text-[10px] text-slate-400 capitalize">
                          {b.industry_type.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                    <Check className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                )}
              </button>
            );
          })}

          {filteredBranches.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No matching branches found.
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReturnToDashboard}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>

          {allowDismiss && (
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
