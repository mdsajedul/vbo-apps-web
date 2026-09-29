'use client';

import React, { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import { useMasterData } from '@/hooks/useMasterData';
import {
  CreditCard, DollarSign, Smartphone, X, CheckCircle2,
  Receipt, User, ArrowRight, CornerDownLeft, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface RestaurantCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  cartItems: any[];
  posConfig: any;
  shiftId?: string;
  onRequestOpenShift?: () => void;
  onSuccess: (settlementResult: any) => void;
}

export function RestaurantCheckoutModal({
  isOpen,
  onClose,
  session,
  cartItems,
  posConfig,
  shiftId,
  onRequestOpenShift,
  onSuccess,
}: RestaurantCheckoutModalProps) {
  const { data: masterPaymentMethods } = useMasterData('PAYMENT_METHOD');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [tips, setTips] = useState<string>('0');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Parse dynamic active payment methods: Tenant Master Data filtered by Restaurant Branch Settings
  const activeMethods = (() => {
    let allowedCodes: string[] | null = null;
    try {
      if (posConfig?.enabled_payment_methods) {
        const parsed = JSON.parse(posConfig.enabled_payment_methods);
        if (Array.isArray(parsed) && parsed.length > 0) allowedCodes = parsed;
      }
    } catch (e) {}

    if (masterPaymentMethods && masterPaymentMethods.length > 0) {
      const filtered = allowedCodes
        ? masterPaymentMethods.filter(m => allowedCodes.includes(m.code))
        : masterPaymentMethods;
      return filtered.map(m => ({
        code: m.code,
        label: m.label,
        label_bn: m.label_bn,
        icon: m.icon,
      }));
    }

    const fallbackCodes = allowedCodes || ['CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET'];
    return fallbackCodes.map(code => ({
      code,
      label: code,
      label_bn: null,
      icon: null,
    }));
  })();

  // Financial calculations — include modifiers in the line subtotal, matching
  // the POS ticket and the server's authoritative reconstruction.
  const subtotalPaisa = cartItems.reduce((sum, item) => {
    const modifierSum = item.modifiers ? item.modifiers.reduce((s: number, m: any) => s + (m.price || 0), 0) : 0;
    return sum + (Number(item.unit_price) + modifierSum) * Number(item.quantity);
  }, 0);
  const subtotalBDT = subtotalPaisa / 100;

  const serviceChargePct = posConfig?.service_charge_enabled !== false ? Number(posConfig?.service_charge_pct || 0) : 0;
  const serviceChargeBDT = subtotalBDT * (serviceChargePct / 100);

  const taxPct = Number(posConfig?.tax_rate_pct || 0);
  const taxBDT = (subtotalBDT + serviceChargeBDT) * (taxPct / 100);

  const grandTotalBDT = Math.round(subtotalBDT + serviceChargeBDT + taxBDT);

  // Initialize amount paid to exact grand total on open
  useEffect(() => {
    if (isOpen) {
      setAmountPaid(grandTotalBDT.toString());
      if (activeMethods.length > 0 && !activeMethods.some(m => m.code === paymentMethod)) {
        setPaymentMethod(activeMethods[0].code);
      }
    }
  }, [isOpen, grandTotalBDT, activeMethods, paymentMethod]);

  if (!isOpen) return null;

  const numericPaid = Number(amountPaid) || 0;
  const changeDueBDT = Math.max(numericPaid - grandTotalBDT, 0);

  const handleQuickTender = (extraAmount: number) => {
    if (extraAmount === 0) {
      setAmountPaid(grandTotalBDT.toString());
    } else {
      setAmountPaid((grandTotalBDT + extraAmount).toString());
    }
  };

  const handleSettle = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty.');
      return;
    }

    if (!shiftId) {
      toast.error('No active register shift found. Please open a shift first.');
      if (onRequestOpenShift) {
        onClose();
        onRequestOpenShift();
      }
      return;
    }

    if (numericPaid < grandTotalBDT && paymentMethod === 'CASH') {
      toast.error(`Amount paid (৳${numericPaid}) is less than grand total (৳${grandTotalBDT})`);
      return;
    }

    if (posConfig?.customer_capture_mode === 'required' && (!customerName || !customerPhone)) {
      toast.error('Customer name and phone number are required for this branch');
      return;
    }

    setSubmitting(true);
    try {
      // If no session ID exists (walk-in takeaway/delivery), create order with pay_now: true
      let targetSessionId = session?.id;
      if (!targetSessionId || targetSessionId.startsWith('temp-') || targetSessionId.startsWith('takeaway-') || targetSessionId.startsWith('delivery-')) {
        if (session?.id?.startsWith('takeaway-')) {
          const res = await restaurantApi.createTakeawayOrder({
            items: cartItems.map((i) => ({
              product_id: i.product_id || i.id,
              menu_item_id: i.menu_item_id || undefined,
              variant_id: i.variant_id || undefined,
              product_name: i.name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              course: i.course,
              special_instructions: i.notes,
              modifier_selections: (i.modifiers || []).map((m: any) => ({
                modifier_id: m.id || m.name,
                modifier_name: m.name,
                modifier_price: m.price,
              })),
            })),
            pay_now: true,
            shift_id: shiftId,
            payment_method: paymentMethod as any,
            amount_paid: Math.round(numericPaid * 100),
          });
          toast.success('🎉 Takeaway Paid & Settled!', {
            description: `Receipt #${res?.sale?.receipt_number || 'RCP-TKW'} | Total: ৳${grandTotalBDT}`
          });
          onSuccess(res?.sale || res);
          onClose();
          return;
        }

        if (session?.id?.startsWith('delivery-')) {
          const res = await restaurantApi.createDeliveryOrder({
            customer_name: session?.customer_name || 'Guest',
            customer_phone: session?.customer_phone || '',
            delivery_address: session?.delivery_address || '',
            delivery_driver: session?.delivery_driver || '',
            notes: session?.notes || '',
            items: cartItems.map((i) => ({
              product_id: i.product_id || i.id,
              menu_item_id: i.menu_item_id || undefined,
              variant_id: i.variant_id || undefined,
              product_name: i.name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              course: i.course,
              special_instructions: i.notes,
              modifier_selections: (i.modifiers || []).map((m: any) => ({
                modifier_id: m.id || m.name,
                modifier_name: m.name,
                modifier_price: m.price,
              })),
            })),
            pay_now: true,
            shift_id: shiftId,
            payment_method: paymentMethod as any,
            amount_paid: Math.round(numericPaid * 100),
          });
          toast.success('🎉 Delivery Paid & Settled!', {
            description: `Receipt #${res?.sale?.receipt_number || 'RCP-DEL'} | Total: ৳${grandTotalBDT}`
          });
          onSuccess(res?.sale || res);
          onClose();
          return;
        }

        const opened = await restaurantApi.openSession({
          table_id: session?.table?.id,
          guest_count: session?.guest_count || 1,
        }).catch(() => null);

        if (opened) {
          targetSessionId = opened.id;
          await restaurantApi.addOrder(targetSessionId, {
            order_type: session?.table ? 'DINE_IN' : 'TAKEAWAY',
            items: cartItems.map((i) => ({
              product_id: i.product_id || i.id,
              menu_item_id: i.menu_item_id || undefined,
              variant_id: i.variant_id || undefined,
              product_name: i.name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              course: i.course,
              special_instructions: i.notes,
              modifier_selections: (i.modifiers || []).map((m: any) => ({
                modifier_id: m.id || m.name,
                modifier_name: m.name,
                modifier_price: m.price,
              })),
            })),
          });
        }
      }

      const settlementPayload = {
        shift_id: shiftId,
        payment_method: paymentMethod as any,
        amount_paid: Math.round(numericPaid * 100), // in paisa
        tips: Math.round(Number(tips) * 100), // BDT -> paisa at the boundary
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
      };

      const res = await restaurantApi.settleSession(targetSessionId, settlementPayload);

      toast.success('🎉 Table Check Settled Successfully!', {
        description: `Receipt #${res?.sale?.receipt_number || 'RCP-RST'} | Total: ৳${grandTotalBDT}`
      });

      onSuccess(res);
      onClose();
    } catch (err: any) {
      console.error('Failed to settle table check', err);
      toast.error(err.response?.data?.message || 'Failed to settle check. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMethodBadge = (m: { code: string; label: string; label_bn?: string | null }) => {
    const code = m.code;
    const displayName = m.label || code;
    switch (code) {
      case 'CASH': return { label: `💵 ${displayName}`, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'CARD': return { label: `💳 ${displayName}`, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };
      case 'BKASH': return { label: `📱 ${displayName}`, color: 'bg-pink-500/20 text-pink-400 border-pink-500/40' };
      case 'NAGAD': return { label: `📱 ${displayName}`, color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
      case 'ROCKET': return { label: `📱 ${displayName}`, color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
      default: return { label: displayName, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 text-stone-900 dark:text-slate-100 z-10 my-8 transition-colors duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center bg-stone-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">Complete Restaurant Checkout</h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                {session?.table ? `${session.table.name || `Table ${session.table.table_number}`}` : 'Walk-in Checkout'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grand Total Highlight Banner */}
        <div className="p-6 bg-stone-100 dark:bg-slate-950 border-b border-stone-200 dark:border-slate-800/80 text-center space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-slate-400 font-semibold">Grand Total Due</span>
          <div className="text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            ৳ {grandTotalBDT.toLocaleString('en-IN')}
          </div>
        </div>

        {!shiftId && (
          <div className="mx-5 mt-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex items-center justify-between gap-3 text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>No active register shift. Start a shift to complete payment.</span>
            </div>
            {onRequestOpenShift && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestOpenShift();
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm"
              >
                Start Shift
              </button>
            )}
          </div>
        )}

        {/* Bill Summary Breakdown */}
        <div className="p-5 space-y-4">
          <div className="p-4 bg-stone-50 dark:bg-slate-950/60 rounded-2xl border border-stone-200 dark:border-slate-800 space-y-1.5 text-xs font-mono text-stone-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal ({cartItems.length} items)</span>
              <span className="text-stone-900 dark:text-white font-semibold">৳ {subtotalBDT.toFixed(2)}</span>
            </div>
            {serviceChargePct > 0 && (
              <div className="flex justify-between">
                <span>Service Charge ({serviceChargePct}%)</span>
                <span className="text-stone-900 dark:text-white font-semibold">৳ {serviceChargeBDT.toFixed(2)}</span>
              </div>
            )}
            {taxPct > 0 && (
              <div className="flex justify-between">
                <span>VAT / Tax ({taxPct}%)</span>
                <span className="text-stone-900 dark:text-white font-semibold">৳ {taxBDT.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-stone-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <span>Net Settlement Amount</span>
              <span className="text-stone-900 dark:text-white font-extrabold">৳ {grandTotalBDT.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Tabs (Dynamic from Branch Config) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 dark:text-slate-300 block">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {activeMethods.map((m) => {
                const badge = getMethodBadge(m);
                const isSelected = paymentMethod === m.code;
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => setPaymentMethod(m.code)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? `${badge.color} shadow-lg shadow-amber-500/10 font-extrabold`
                        : 'bg-stone-100 dark:bg-slate-950 border-stone-300 dark:border-slate-800 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{badge.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered Controls */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-3 p-4 bg-stone-50 dark:bg-slate-950/60 rounded-2xl border border-stone-200 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-700 dark:text-slate-300">Amount Tendered (৳)</label>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Change: ৳ {changeDueBDT.toFixed(0)}
                </span>
              </div>

              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-lg font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
              />

              {/* Quick Tender Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickTender(0)}
                  className="flex-1 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[11px] font-bold text-stone-700 dark:text-slate-300"
                >
                  Exact (৳{grandTotalBDT})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTender(100)}
                  className="flex-1 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[11px] font-bold text-stone-700 dark:text-slate-300"
                >
                  +৳100
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTender(500)}
                  className="flex-1 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[11px] font-bold text-stone-700 dark:text-slate-300"
                >
                  +৳500
                </button>
              </div>
            </div>
          )}

          {/* Optional Customer Capture Field */}
          {posConfig?.customer_capture_mode !== 'off' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[11px] font-bold text-stone-500 dark:text-slate-400 block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-stone-500 dark:text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01711XXXXXX"
                  className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600"
                />
              </div>
            </div>
          )}

          {/* Tips Field */}
          <div className="pt-1">
             <label className="text-[11px] font-bold text-stone-500 dark:text-slate-400 block mb-1">Tips for Waiter (৳)</label>
             <input
               type="number"
               value={tips}
               onChange={(e) => setTips(e.target.value)}
               placeholder="0"
               className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 placeholder-stone-400 dark:placeholder-slate-600"
             />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950/60 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || cartItems.length === 0}
            onClick={handleSettle}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-amber-600/20 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Settling Check...' : 'Confirm Settlement'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
