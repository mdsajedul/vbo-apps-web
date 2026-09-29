'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface CancelSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName?: string;
  onConfirm: (reason: string) => void;
}

export function CancelSessionModal({ isOpen, onClose, sessionName, onConfirm }: CancelSessionModalProps) {
  const [cancelReason, setCancelReason] = useState('');

  const handleClose = () => {
    setCancelReason('');
    onClose();
  };

  const handleConfirm = () => {
    if (!cancelReason.trim()) return;
    onConfirm(cancelReason);
    setCancelReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="rounded-3xl max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center space-x-3 text-red-500">
            <AlertTriangle className="w-6 h-6" />
            <DialogTitle className="text-lg">Cancel Active Order</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Are you sure you want to cancel the session for {sessionName || 'this session'}? This will void all items and free the table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
            Reason for Cancellation (Required):
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Guest Left, Order Error, Table Changed..."
            className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl p-3 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            rows={3}
            autoFocus
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-stone-300 dark:hover:bg-slate-700 transition-colors"
          >
            Nevermind
          </button>
          <button
            onClick={handleConfirm}
            disabled={!cancelReason.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            Confirm Cancellation
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
