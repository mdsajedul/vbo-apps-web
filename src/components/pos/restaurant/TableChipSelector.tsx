'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  name?: string;
  table_number?: string;
  zone_name?: string;
  capacity?: number;
  isOccupied?: boolean;
  activeSession?: any;
}

interface TableChipSelectorProps {
  tables: Table[];
  selectedTableId?: string;
  onSelect: (table: Table) => void;
  className?: string;
  label?: string;
}

export function TableChipSelector({
  tables,
  selectedTableId,
  onSelect,
  className,
  label = 'Select Table',
}: TableChipSelectorProps) {
  // Group tables by zone
  const zonesMap = new Map<string, Table[]>();
  tables.forEach((t) => {
    const zone = t.zone_name || 'Main Zone';
    if (!zonesMap.has(zone)) zonesMap.set(zone, []);
    zonesMap.get(zone)!.push(t);
  });

  if (tables.length === 0) {
    return (
      <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">{label}</p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from(zonesMap.entries()).map(([zone, zoneTables]) => (
        <div key={zone}>
          <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {zone}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {zoneTables.map((tbl) => {
              const isSelected = selectedTableId === tbl.id;
              const label = tbl.name || `Table ${tbl.table_number}`;

              return (
                <button
                  key={tbl.id}
                  onClick={() => onSelect(tbl)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                    tbl.isOccupied
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                      : 'border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 hover:border-emerald-500/60 dark:hover:border-emerald-500/50',
                    isSelected && 'ring-2 ring-amber-500 border-amber-500'
                  )}
                  aria-pressed={isSelected}
                  title={`${label} — ${tbl.isOccupied ? `${tbl.capacity || 4} guests, occupied` : 'Available'} (${zone})`}
                >
                  {tbl.isOccupied ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                  <span>{label}</span>
                  <span className={cn(
                    'text-[10px] font-mono',
                    tbl.isOccupied ? 'text-amber-500' : 'text-stone-400 dark:text-slate-500'
                  )}>
                    {tbl.capacity || 4}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
