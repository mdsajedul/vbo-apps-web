'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Play, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { restaurantApi } from '@/lib/restaurant-api';
import { toast } from 'sonner';

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  onRecallSession: (session: any) => void;
}

export function HeldOrdersModal({
  isOpen,
  onClose,
  branchId,
  onRecallSession,
}: HeldOrdersModalProps) {
  const [heldSessions, setHeldSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHeldSessions = async () => {
    setLoading(true);
    try {
      const data = await restaurantApi.getHeldSessions(branchId).catch(() => []);
      setHeldSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch held sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHeldSessions();
    }
  }, [isOpen, branchId]);

  if (!isOpen) return null;

  const handleRecall = async (session: any) => {
    try {
      toast.loading(`Recalling ticket...`, { id: 'recall-toast' });
      await restaurantApi.recallSession(session.id);
      toast.success(`Ticket recalled!`, { id: 'recall-toast' });
      onRecallSession(session);
      onClose();
    } catch (err) {
      console.error('Failed to recall session', err);
      toast.error('Failed to recall ticket', { id: 'recall-toast' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 text-stone-900 dark:text-slate-100 z-10 my-8 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center bg-stone-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">Parked & Held Tickets</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">Recall held orders to continue service & checkout</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {loading ? (
            <div className="py-12 text-center text-stone-400 dark:text-slate-400 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
              <p className="text-xs font-semibold">Loading held tickets...</p>
            </div>
          ) : heldSessions.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-slate-500 space-y-2">
              <UtensilsCrossed className="w-10 h-10 opacity-30 text-amber-500 mx-auto" />
              <p className="text-xs font-bold">No held or parked tickets found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heldSessions.map((session) => {
                const tableName = session.table?.name || (session.table?.table_number ? `Table ${session.table.table_number}` : 'Parked Order');
                const heldTime = session.held_at ? new Date(session.held_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                
                let itemCount = 0;
                let subtotal = 0;
                session.orders?.forEach((o: any) => {
                  o.order_items?.forEach((i: any) => {
                    itemCount += Number(i.quantity);
                    subtotal += Number(i.unit_price) * Number(i.quantity);
                  });
                });

                return (
                  <div key={session.id} className="p-4 bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 rounded-2xl space-y-3 hover:border-amber-500/50 transition-all shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">{tableName}</h4>
                        <p className="text-xs text-stone-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          Held at {heldTime}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded text-[10px] font-mono font-bold">
                        HELD
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-stone-200 dark:border-slate-800/60">
                      <span className="text-stone-500 dark:text-slate-400">{itemCount} Dish Item(s)</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">৳ {(subtotal / 100).toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRecall(session)}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Recall & Open Ticket</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
