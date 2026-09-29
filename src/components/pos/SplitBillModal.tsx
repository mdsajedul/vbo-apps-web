'use client';

import React, { useState } from 'react';
import { X, Split, Users, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotalBDT: number;
  guestCount?: number;
  cartItems?: any[];
  onConfirmSplit: (splitAmountBDT: number, type: 'EQUAL' | 'ITEMS') => void;
}

export function SplitBillModal({
  isOpen,
  onClose,
  grandTotalBDT,
  guestCount = 2,
  cartItems = [],
  onConfirmSplit,
}: SplitBillModalProps) {
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'ITEMS'>('EQUAL');
  const [splitsCount, setSplitsCount] = useState<number>(guestCount > 1 ? guestCount : 2);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const equalShareBDT = grandTotalBDT / Math.max(splitsCount, 1);

  const selectedItemsTotalBDT = cartItems
    .filter((i) => selectedItemIds.includes(i.id))
    .reduce((sum, item) => {
      const modPrice = item.modifiers ? item.modifiers.reduce((s: number, m: any) => s + (m.price || 0), 0) : 0;
      return sum + ((item.unit_price + modPrice) * item.quantity) / 100;
    }, 0);

  const toggleItemSelection = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((i) => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleConfirm = () => {
    if (splitMode === 'EQUAL') {
      onConfirmSplit(equalShareBDT, 'EQUAL');
      toast.success(`Equal split: ৳ ${equalShareBDT.toFixed(2)} per guest`);
    } else {
      if (selectedItemIds.length === 0) {
        toast.error('Please select at least 1 item to split');
        return;
      }
      onConfirmSplit(selectedItemsTotalBDT, 'ITEMS');
      toast.success(`Selected items split: ৳ ${selectedItemsTotalBDT.toFixed(2)}`);
    }
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
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">Split Check / Bill</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">Total Check: ৳ {grandTotalBDT.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-slate-950 p-1 rounded-2xl border border-stone-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSplitMode('EQUAL')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                splitMode === 'EQUAL' ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold' : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Equal Split</span>
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('ITEMS')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                splitMode === 'ITEMS' ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold' : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>By Line Item</span>
            </button>
          </div>

          {splitMode === 'EQUAL' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 dark:text-slate-400">Number of Guests / Paying Covers</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setSplitsCount(Math.max(splitsCount - 1, 2))}
                    className="w-10 h-10 bg-stone-100 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 hover:border-amber-500 rounded-xl font-bold text-stone-900 dark:text-white text-base"
                  >
                    -
                  </button>
                  <span className="text-lg font-mono font-extrabold text-stone-900 dark:text-white">{splitsCount}</span>
                  <button
                    type="button"
                    onClick={() => setSplitsCount(splitsCount + 1)}
                    className="w-10 h-10 bg-stone-100 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 hover:border-amber-500 rounded-xl font-bold text-stone-900 dark:text-white text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-2xl space-y-1">
                <span className="text-xs text-stone-500 dark:text-slate-400 font-mono">Each Guest Pays</span>
                <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">৳ {equalShareBDT.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-500 dark:text-slate-400">Select Items for This Partial Check</label>
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {cartItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const modPrice = item.modifiers ? item.modifiers.reduce((s: number, m: any) => s + (m.price || 0), 0) : 0;
                  const itemBDT = ((item.unit_price + modPrice) * item.quantity) / 100;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItemSelection(item.id)}
                      className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold'
                          : 'border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 text-stone-700 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-semibold">{item.quantity}x {item.name}</span>
                      <span className="text-xs font-mono font-bold">৳ {itemBDT.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs font-mono">
                <span className="text-stone-500 dark:text-slate-400">Selected Items Total</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">৳ {selectedItemsTotalBDT.toFixed(2)}</span>
              </div>
            </div>
          )}
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
            onClick={handleConfirm}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Proceed to Partial Pay</span>
          </button>
        </div>

      </div>
    </div>
  );
}
