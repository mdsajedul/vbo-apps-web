'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Smartphone, Zap, Flame, Scissors } from 'lucide-react';

interface InlinePaymentPanelProps {
  grandTotalBDT: number;
  posConfig: any;
  submitting: boolean;
  onSettle: (paymentMethod: string, amountPaid: number, customerInfo?: { name?: string; phone?: string }) => void;
  onFireKOT?: () => void;
  onOpenSplitModal?: () => void;
  disabled?: boolean;
  paymentMethod?: string;
  setPaymentMethod?: (method: string) => void;
  customerName?: string;
  customerPhone?: string;
}

export function InlinePaymentPanel({
  grandTotalBDT,
  posConfig,
  submitting,
  onSettle,
  onFireKOT,
  onOpenSplitModal,
  disabled = false,
  paymentMethod: externalPaymentMethod,
  setPaymentMethod: externalSetPaymentMethod,
  customerName: externalCustomerName,
  customerPhone: externalCustomerPhone,
}: InlinePaymentPanelProps) {
  const [internalPaymentMethod, setInternalPaymentMethod] = useState<string>('CASH');
  const activePaymentMethod = externalPaymentMethod || internalPaymentMethod;

  const [amountPaid, setAmountPaid] = useState<string>('');

  // Keep tendered amount in sync with grand total on change unless manually edited
  useEffect(() => {
    setAmountPaid(grandTotalBDT > 0 ? grandTotalBDT.toString() : '');
  }, [grandTotalBDT]);

  const numericPaid = Number(amountPaid) || 0;
  const changeDueBDT = Math.max(numericPaid - grandTotalBDT, 0);

  const handleQuickTender = (extraAmount: number) => {
    if (extraAmount === 0) {
      setAmountPaid(grandTotalBDT.toString());
    } else {
      const current = Number(amountPaid) || 0;
      setAmountPaid((current + extraAmount).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || submitting || grandTotalBDT <= 0) return;
    onSettle(activePaymentMethod, numericPaid, {
      name: externalCustomerName?.trim() || undefined,
      phone: externalCustomerPhone?.trim() || undefined,
    });
  };

  return (
    <div className="space-y-2 pt-1.5 border-t border-[#e0e3e5] dark:border-slate-800">
      {/* Cash Tendered & Presets (+500, +1000) */}
      {activePaymentMethod === 'CASH' && (
        <div className="p-2.5 bg-[#f7f9fb] dark:bg-slate-950 rounded-xl border border-[#e0e3e5] dark:border-slate-800 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-semibold text-[#6c7a71] dark:text-slate-400">Cash:</span>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={grandTotalBDT.toString()}
              className="w-20 h-8 bg-white dark:bg-slate-900 border border-[#e0e3e5] dark:border-slate-800 rounded-lg px-2 text-sm font-mono font-bold text-[#006c49] dark:text-[#4edea3] focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 text-center shadow-none"
              title="Tendered Amount (৳)"
            />
          </div>

          {/* Quick Preset Chips */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => handleQuickTender(500)}
              className="h-8 px-2.5 bg-white hover:bg-stone-50 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-[#191c1e] dark:text-slate-200 transition-all border border-[#e0e3e5] dark:border-slate-800 hover:border-[#006c49] active:scale-95 shadow-none"
              title="Add ৳500"
            >
              +500
            </button>
            <button
              type="button"
              onClick={() => handleQuickTender(1000)}
              className="h-8 px-2.5 bg-white hover:bg-stone-50 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-[#191c1e] dark:text-slate-200 transition-all border border-[#e0e3e5] dark:border-slate-800 hover:border-[#006c49] active:scale-95 shadow-none"
              title="Add ৳1000"
            >
              +1000
            </button>
          </div>

          {/* Change Due Badge */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-[#006c49] dark:text-[#4edea3] flex items-center shrink-0">
            Change: ৳{changeDueBDT.toFixed(0)}
          </div>
        </div>
      )}

      {/* Action Buttons (Fire KOT + Split Check + Settle & Print) */}
      <div className="grid grid-cols-6 gap-2 pt-0.5">
        {onFireKOT && (
          <button
            type="button"
            disabled={disabled}
            onClick={onFireKOT}
            className="col-span-2 sm:col-span-2 h-11 bg-[#006c49]/10 hover:bg-[#006c49]/20 disabled:opacity-40 text-[#006c49] dark:text-[#4edea3] font-bold rounded-xl text-xs transition-all border border-[#006c49]/30 flex items-center justify-center gap-1 active:scale-95"
          >
            <Flame className="w-3.5 h-3.5 text-[#006c49] dark:text-[#4edea3]" />
            <span>Fire KOT</span>
          </button>
        )}
        {onOpenSplitModal && (
          <button
            type="button"
            disabled={disabled || grandTotalBDT <= 0}
            onClick={onOpenSplitModal}
            className={`${
              onFireKOT ? 'col-span-1 sm:col-span-2' : 'col-span-2'
            } h-11 bg-[#f2f4f6] hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-[#191c1e] dark:text-slate-200 font-semibold rounded-xl text-xs transition-all border border-[#bbcabf] dark:border-slate-700 active:scale-95 flex items-center justify-center gap-1.5 px-2`}
            title="Split Check"
          >
            <Scissors className="w-4 h-4 text-[#191c1e] dark:text-slate-200 shrink-0" />
            <span className="hidden sm:inline">Split Check</span>
          </button>
        )}
        <button
          type="button"
          disabled={disabled || submitting || grandTotalBDT <= 0}
          onClick={handleSubmit}
          data-pos-settle-btn
          className={`${
            onFireKOT && onOpenSplitModal
              ? 'col-span-3 sm:col-span-2'
              : onFireKOT || onOpenSplitModal
              ? 'col-span-4 sm:col-span-3'
              : 'col-span-6'
          } h-11 bg-[#006c49] hover:bg-[#005a3d] disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006c49] focus-visible:ring-offset-2`}
        >
          <Zap className="w-3.5 h-3.5 text-white fill-white shrink-0" />
          <span className="truncate">{submitting ? 'Settling...' : `Settle & Print (৳${grandTotalBDT})`}</span>
        </button>
      </div>
    </div>
  );
}
