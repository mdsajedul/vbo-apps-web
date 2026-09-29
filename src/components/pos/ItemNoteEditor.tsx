'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, X, Check } from 'lucide-react';

interface ItemNoteEditorProps {
  isOpen: boolean;
  initialNote?: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export function ItemNoteEditor({
  isOpen,
  initialNote = '',
  onClose,
  onSave,
}: ItemNoteEditorProps) {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Popover Card */}
      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4 text-stone-900 dark:text-slate-100 z-10 transition-colors duration-200">
        <div className="flex justify-between items-center pb-2 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
            <Pencil className="w-4 h-4" />
            <h4 className="font-bold text-xs text-stone-900 dark:text-white">Item Special Instructions</h4>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. No onion, extra spicy, sauce on side..."
          className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl p-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500"
        />

        <div className="flex space-x-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Note</span>
          </button>
        </div>
      </div>
    </div>
  );
}
