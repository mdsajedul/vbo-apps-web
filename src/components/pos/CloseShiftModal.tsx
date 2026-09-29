'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, CheckCircle2, AlertTriangle, Printer, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { posApi } from '@/lib/api';
import { toast } from 'sonner';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: any;
  onSuccess: () => void;
}

export function CloseShiftModal({
  isOpen,
  onClose,
  shift,
  onSuccess,
}: CloseShiftModalProps) {
  const [actualCash, setActualCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Financial summary
  const summary = shift?.summary || {};
  const startingCashBDT = Number(summary.starting_cash_bdt || (shift?.starting_cash ? shift.starting_cash / 100 : 0));
  const cashSalesBDT = Number(summary.cash_sales_bdt || 0);
  const cardSalesBDT = Number(summary.card_sales_bdt || 0);
  const mfsSalesBDT = Number(summary.mfs_sales_bdt || 0);
  const expectedCashBDT = Number(summary.expected_cash_bdt || (startingCashBDT + cashSalesBDT));

  useEffect(() => {
    if (isOpen) {
      setActualCash(expectedCashBDT.toFixed(2));
    }
  }, [isOpen, expectedCashBDT]);

  if (!isOpen || !shift) return null;

  const actualCashBDT = parseFloat(actualCash) || 0;
  const varianceBDT = actualCashBDT - expectedCashBDT;

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      toast.loading('Closing register shift & performing audit...', { id: 'shift-close-toast' });
      await posApi.closeShift(shift.id, {
        actual_cash: actualCashBDT,
        notes: notes || undefined,
      });

      toast.success('🔴 Register shift closed & audited!', { id: 'shift-close-toast' });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to close shift', err);
      toast.error(err.response?.data?.message || 'Failed to close register shift', { id: 'shift-close-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 text-stone-900 dark:text-slate-100 z-10 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center bg-stone-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">Close Register & Z-Report Audit</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">Count drawer cash float & reconcile register totals</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Audit Summary */}
        <form onSubmit={handleCloseShift} className="p-6 space-y-5">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-slate-800/80 rounded-2xl text-xs">
            <div className="space-y-1">
              <span className="text-stone-500 dark:text-slate-400">Opening Float:</span>
              <p className="font-mono font-bold text-stone-900 dark:text-white">৳ {startingCashBDT.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-stone-500 dark:text-slate-400">Total Cash Sales:</span>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+ ৳ {cashSalesBDT.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-stone-500 dark:text-slate-400">Card / MFS Sales:</span>
              <p className="font-mono font-bold text-sky-600 dark:text-sky-400">৳ {(cardSalesBDT + mfsSalesBDT).toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-stone-500 dark:text-slate-400">Expected Cash in Drawer:</span>
              <p className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-sm">৳ {expectedCashBDT.toFixed(2)}</p>
            </div>
          </div>

          {/* Actual Cash Count Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                Actual Counted Cash in Drawer (BDT):
              </label>
              {/* Over/Short Variance Badge */}
              {varianceBDT === 0 ? (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold">
                  ✓ Balanced (৳ 0.00)
                </span>
              ) : varianceBDT < 0 ? (
                <span className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Shortage (৳ {Math.abs(varianceBDT).toFixed(2)})
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Overage (+ ৳ {varianceBDT.toFixed(2)})
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-amber-500 text-sm">৳</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-3 text-base font-extrabold font-mono text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Audit Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 dark:text-slate-300">Closing Notes / Discrepancy Reason:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Minor cash discrepancy due to change rounding..."
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl p-3 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Close Register</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
