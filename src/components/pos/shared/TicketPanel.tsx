'use client';

import React from 'react';
import { ChefHat, Pencil, Trash2, UtensilsCrossed, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBDT } from '@/lib/utils';

export interface TicketLineItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number; // paisa
  modifiers?: Array<{ name: string; price: number }>;
  notes?: string;
  image_url?: string;
  is_fired?: boolean;
}

export interface TicketTotals {
  subtotal: number; // paisa
  discount?: number; // paisa
  discountReason?: string;
  serviceChargePct?: number;
  serviceChargeAmount?: number; // paisa
  taxPct?: number;
  taxAmount?: number; // paisa
  grandTotal: number; // paisa
}

interface TicketPanelProps {
  /** Cart line items */
  items: TicketLineItem[];
  /** Empty cart message */
  emptyMessage?: string;
  /** Render a custom item info section (e.g. table selector, delivery banner) */
  renderHeader?: () => React.ReactNode;
  /** Render a custom line item prefix */
  renderItemActions?: (item: TicketLineItem) => React.ReactNode;
  /** Called when quantity decreases */
  onDecrement: (itemId: string, currentQty: number) => void;
  /** Called when quantity increases */
  onIncrement: (itemId: string, currentQty: number) => void;
  /** Called when edit note is clicked */
  onEditNote?: (item: TicketLineItem) => void;
  /** Called when remove is clicked */
  onRemoveItem: (itemId: string) => void;
  /** Totals data */
  totals: TicketTotals;
  /** Format image URL resolver */
  getImageUrl?: (url?: string) => string | null;
  /** Render custom totals footer or additional payment */
  renderFooter: () => React.ReactNode;
  /** Custom class for the container */
  className?: string;
}

export function TicketPanel({
  items,
  emptyMessage = 'No items added to ticket.',
  renderHeader,
  renderItemActions,
  onDecrement,
  onIncrement,
  onEditNote,
  onRemoveItem,
  totals,
  getImageUrl,
  renderFooter,
  className,
}: TicketPanelProps) {
  const { subtotal, discount, discountReason, serviceChargePct, serviceChargeAmount, taxPct, taxAmount, grandTotal } = totals;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar min-h-[120px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 dark:text-slate-500 space-y-1 py-8">
            <ChefHat className="w-8 h-8 opacity-30 text-amber-500" />
            <p className="text-sm font-medium">{emptyMessage}</p>
          </div>
        ) : (
          items.map((item) => {
            const imgUrl = item.image_url && getImageUrl ? getImageUrl(item.image_url) : null;
            const addonPrice = item.modifiers ? item.modifiers.reduce((s, m) => s + (m.price || 0), 0) : 0;
            const totalUnitPrice = item.unit_price + addonPrice;

            return (
              <div
                key={item.id}
                className={cn(
                  'p-2 bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800/80 rounded-2xl flex gap-3 items-center justify-between shadow-sm transition-all hover:border-stone-300 dark:hover:border-slate-700',
                  item.is_fired && 'border-l-2 border-l-emerald-500'
                )}
              >
                {/* Left: Thumbnail + Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <UtensilsCrossed className="w-4 h-4 text-amber-500/70" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-stone-900 dark:text-white truncate block">{item.name}</span>
                      {item.is_fired && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Sent to kitchen" />
                      )}
                    </div>
                    <span className="text-xs text-stone-500 dark:text-slate-400 font-mono block">
                      ৳ {formatBDT(totalUnitPrice)} /ea
                    </span>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono truncate">
                        + {item.modifiers.map((m) => m.name).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic font-mono truncate">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {renderItemActions?.(item)}

                {/* Quantity Stepper */}
                <div className="bg-stone-100 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-full px-3 py-1.5 flex items-center space-x-3 shrink-0 shadow-inner">
                  <button
                    onClick={() => onDecrement(item.id, item.quantity)}
                    className="w-5 h-5 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white font-bold text-sm transition-colors rounded-full hover:bg-stone-200 dark:hover:bg-slate-800"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-mono font-bold text-stone-900 dark:text-white min-w-[16px] text-center select-none">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onIncrement(item.id, item.quantity)}
                    className="w-5 h-5 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white font-bold text-sm transition-colors rounded-full hover:bg-stone-200 dark:hover:bg-slate-800"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-1 shrink-0">
                  {onEditNote && (
                    <button
                      onClick={() => onEditNote(item)}
                      className="p-2 text-stone-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 transition-colors rounded-lg hover:bg-stone-200 dark:hover:bg-slate-800"
                      aria-label={`Edit note for ${item.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 text-stone-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-stone-200 dark:hover:bg-slate-800"
                    aria-label={`Remove ${item.name} from ticket`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Totals Footer */}
      <div className="shrink-0 p-3 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 space-y-2 shadow-2xl">
        <div className="space-y-0.5 text-xs text-stone-600 dark:text-slate-400 font-mono">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>৳ {formatBDT(subtotal)}</span>
          </div>

          {(discount ?? 0) > 0 && (
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>Discount {discountReason ? `(${discountReason})` : ''}</span>
              <span>- ৳ {formatBDT(discount ?? 0)}</span>
            </div>
          )}

          {serviceChargePct && serviceChargePct > 0 && (
            <div className="flex justify-between text-stone-600 dark:text-slate-400">
              <span>Service Charge ({serviceChargePct}%)</span>
              <span>৳ {formatBDT(serviceChargeAmount ?? 0)}</span>
            </div>
          )}

          {taxPct && taxPct > 0 && (
            <div className="flex justify-between text-stone-600 dark:text-slate-400">
              <span>VAT ({taxPct}%)</span>
              <span>৳ {formatBDT(taxAmount ?? 0)}</span>
            </div>
          )}

          <div className="flex justify-between items-center px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl my-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Total Payable</span>
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">৳ {formatBDT(grandTotal)}</span>
          </div>
        </div>

        {renderFooter()}
      </div>
    </div>
  );
}
