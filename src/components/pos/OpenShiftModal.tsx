'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, DollarSign, Clock, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { posApi } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';
import { toast } from 'sonner';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  onSuccess: (shift: any) => void;
}

export function OpenShiftModal({
  isOpen,
  onClose,
  branchId,
  onSuccess,
}: OpenShiftModalProps) {
  const router = useRouter();
  const [startingCash, setStartingCash] = useState<string>('2000');
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<{
    active_branch_id: string;
    active_branch_name: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setConflict(null);
    onClose();
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmount = parseFloat(startingCash);
    if (isNaN(floatAmount) || floatAmount < 0) {
      toast.error('Please enter a valid starting cash float');
      return;
    }

    if (!branchId) {
      toast.error('Branch context missing');
      return;
    }

    setSubmitting(true);
    try {
      toast.loading('Opening register shift...', { id: 'shift-toast' });
      const newShift = await posApi.openShift({
        branch_id: branchId,
        starting_cash: floatAmount,
      });
      toast.success('🟢 Register shift opened successfully!', { id: 'shift-toast' });
      onSuccess(newShift);
      handleClose();
    } catch (err: any) {
      console.error('Failed to open shift', err);
      const errData = err.response?.data;
      if (errData?.error === 'ACTIVE_SHIFT_OTHER_BRANCH' && errData?.active_branch_id) {
        setConflict({
          active_branch_id: errData.active_branch_id,
          active_branch_name: errData.active_branch_name || 'Another Branch',
          message: errData.message || 'You already have an active shift open at another branch.',
        });
        toast.error(`Shift already open at ${errData.active_branch_name || 'another branch'}`, { id: 'shift-toast' });
      } else {
        toast.error(errData?.message || 'Failed to open register shift', { id: 'shift-toast' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchBranch = () => {
    if (!conflict?.active_branch_id) return;
    useBranchStore.getState().setBranch(conflict.active_branch_id);
    router.push('/pos');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-0 text-stone-900 dark:text-slate-100 z-10 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center bg-stone-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${conflict ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'} border rounded-xl flex items-center justify-center`}>
              {conflict ? <ShieldAlert className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                {conflict ? 'Active Shift Conflict' : 'Start Register Shift'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {conflict ? 'Reconciliation required before opening new drawer' : 'Enter opening cash float to begin active duty'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {conflict ? (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start space-x-3 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Drawer is currently open at {conflict.active_branch_name}
                </p>
                <p className="text-stone-600 dark:text-slate-300">
                  You cannot have multiple active register drawers open simultaneously. Please return to <strong>{conflict.active_branch_name}</strong> to close and balance your drawer first.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSwitchBranch}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Switch to {conflict.active_branch_name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOpenShift} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center justify-between">
                <span>Opening Cash Float (BDT)</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">In Drawer</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-amber-500 text-sm">৳</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  placeholder="2000.00"
                  className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-3 text-base font-extrabold font-mono text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                This amount is your starting cash drawer balance before accepting sales.
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Open Register Shift</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
