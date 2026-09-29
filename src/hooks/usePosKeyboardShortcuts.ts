'use client';

import { useEffect } from 'react';

interface PosKeyboardShortcuts {
  onSearchFocus?: () => void;
  onFireKOT?: () => void;
  onHeldOrders?: () => void;
  onRefresh?: () => void;
  onSettle?: () => void;
  onTab1?: () => void;
  onTab2?: () => void;
  onTab3?: () => void;
}

/**
 * Global keyboard shortcuts for POS screens.
 * Only activates when no input/textarea/select is focused.
 */
export function usePosKeyboardShortcuts(handlers: PosKeyboardShortcuts): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();

      // Don't intercept when typing in inputs
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        // Escape is handled by shadcn Dialog automatically
        return;
      }

      switch (e.key) {
        case 'F2':
          e.preventDefault();
          handlers.onSearchFocus?.();
          break;
        case 'F3':
          e.preventDefault();
          handlers.onFireKOT?.();
          break;
        case 'F4':
          e.preventDefault();
          handlers.onHeldOrders?.();
          break;
        case 'F5':
          e.preventDefault();
          handlers.onRefresh?.();
          break;
        case 'F8':
          e.preventDefault();
          handlers.onSettle?.();
          break;
        case '1':
          handlers.onTab1?.();
          break;
        case '2':
          handlers.onTab2?.();
          break;
        case '3':
          handlers.onTab3?.();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
