'use client';

import React, { useState } from 'react';
import { X, Tag, Percent, DollarSign, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotalBDT: number;
  compReasons?: string[];
  onApplyDiscount: (discountAmountPaisa: number, reason: string) => void;
}

export function DiscountModal({
  isOpen,
  onClose,
  subtotalBDT,
  compReasons = ['VIP Customer', 'Manager Comp', 'Staff Discount', 'Complimentary / Promo', 'Food Quality Issue'],
  onApplyDiscount,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>(compReasons[0] || 'Manager Comp');
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen) return null;

  const numericValue = parseFloat(value) || 0;

  let calculatedDiscountBDT = 0;
  if (discountType === 'PERCENTAGE') {
    calculatedDiscountBDT = Math.min((subtotalBDT * numericValue) / 100, subtotalBDT);
  } else {
    calculatedDiscountBDT = Math.min(numericValue, subtotalBDT);
  }

  const handleApply = () => {
    if (numericValue <= 0) {
      toast.error('Please enter a valid discount amount');
      return;
    }

    const reason = selectedReason === 'OTHER' ? customReason.trim() : selectedReason;
    if (!reason) {
      toast.error('Please provide a discount/comp reason');
      return;
    }

    const discountPaisa = Math.round(calculatedDiscountBDT * 100);
    onApplyDiscount(discountPaisa, reason);
    toast.success(`Discount of ৳ ${calculatedDiscountBDT.toFixed(2)} applied!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-0 text-stone-900 dark:text-slate-100 z-10 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center bg-stone-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">Apply Ticket Discount</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">Ticket Subtotal: ৳ {subtotalBDT.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-slate-950 p-1 rounded-2xl border border-stone-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDiscountType('PERCENTAGE')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                discountType === 'PERCENTAGE' ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold' : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Percentage (%)</span>
            </button>
            <button
              type="button"
              onClick={() => setDiscountType('FIXED')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                discountType === 'FIXED' ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold' : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Fixed Amount (৳)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 dark:text-slate-400">
              {discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (৳)'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 150'}
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Preset Reasons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 dark:text-slate-400">Comp / Discount Reason</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              {compReasons.map((reason) => (
                <option key={reason} value={reason} className="bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200">
                  {reason}
                </option>
              ))}
              <option value="OTHER" className="bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200">Other / Custom Reason...</option>
            </select>
          </div>

          {selectedReason === 'OTHER' && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Specify reason..."
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          )}

          {/* Summary Box */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex justify-between items-center text-xs">
            <span className="text-stone-700 dark:text-slate-300 font-semibold">Total Discount Savings</span>
            <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400">৳ {calculatedDiscountBDT.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950/60 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Apply Discount</span>
          </button>
        </div>

      </div>
    </div>
  );
}
