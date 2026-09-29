'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryPill {
  id: string;
  name: string;
  icon?: string;
}

interface CategoryPillsProps {
  categories: CategoryPill[];
  selectedId: string;
  onSelect: (id: string) => void;
  allLabel?: string;
  className?: string;
}

export function CategoryPills({
  categories,
  selectedId,
  onSelect,
  allLabel = 'All Items',
  className = '',
}: CategoryPillsProps) {
  return (
    <div className={cn('flex items-center space-x-2 overflow-x-auto custom-scrollbar', className)}>
      <button
        onClick={() => onSelect('ALL')}
        className={cn(
          'px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all font-bold',
          selectedId === 'ALL'
            ? 'bg-stone-800 dark:bg-slate-800 text-white border border-stone-700 dark:border-slate-700 shadow-sm'
            : 'bg-transparent text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white border border-stone-300 dark:border-slate-800/80 hover:border-stone-400 dark:hover:border-slate-700'
        )}
        aria-pressed={selectedId === 'ALL'}
      >
        {allLabel}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all font-bold',
            selectedId === cat.id
              ? 'bg-stone-800 dark:bg-slate-800 text-white border border-stone-700 dark:border-slate-700 shadow-sm'
              : 'bg-transparent text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white border border-stone-300 dark:border-slate-800/80 hover:border-stone-400 dark:hover:border-slate-700'
          )}
          aria-pressed={selectedId === cat.id}
        >
          {cat.icon && <span className="mr-1">{cat.icon}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  );
}
