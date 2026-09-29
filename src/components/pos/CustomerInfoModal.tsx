'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialPhone?: string;
  onSave: (name: string, phone: string) => void;
}

export function CustomerInfoModal({
  isOpen,
  onClose,
  initialName = '',
  initialPhone = '',
  onSave,
}: CustomerInfoModalProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);

  // Sync with external state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setPhone(initialPhone);
    }
  }, [isOpen, initialName, initialPhone]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="rounded-2xl max-w-md p-5">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-[#006c49] dark:text-[#4edea3]" />
            <DialogTitle className="text-base">Guest / Customer Information</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">Guest Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mr. Rahman"
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 font-bold"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01712345678"
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 font-bold"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setName('');
              setPhone('');
            }}
            className="px-3 py-2 text-xs font-bold text-red-500 hover:underline"
            aria-label="Clear guest information"
          >
            Clear Info
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-stone-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(name, phone);
                if (name) {
                  toast.success(`Attached guest: ${name}`);
                }
              }}
              className="px-5 py-2 bg-[#006c49] hover:bg-[#005a3d] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              Save Guest Info
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
