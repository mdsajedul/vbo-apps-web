'use client';

import React from 'react';
import { UtensilsCrossed, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  name?: string;
  table_number?: string;
  zone_name?: string;
  capacity?: number;
  seats?: number;
  shape?: string;
  position_x?: number;
  position_y?: number;
  isOccupied?: boolean;
  activeSession?: any;
}

interface FloorPlanViewProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  className?: string;
}

const SHAPE_CLASSES: Record<string, string> = {
  SQUARE: 'rounded-2xl',
  ROUND: 'rounded-full',
  RECTANGLE: 'rounded-xl',
};

export function FloorPlanView({ tables, onSelectTable, className }: FloorPlanViewProps) {
  if (tables.length === 0) {
    return (
      <div className="py-20 text-center text-stone-500 space-y-3 bg-white/70 dark:bg-slate-900/40 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <UtensilsCrossed className="w-12 h-12 mx-auto opacity-30 text-amber-500" />
        <h3 className="text-sm font-bold text-stone-700 dark:text-slate-300">No Dining Tables Configured</h3>
        <p className="text-xs max-w-sm mx-auto text-stone-500 dark:text-slate-500">
          Go to Table Floor Plans in admin dashboard to set up physical dining tables.
        </p>
      </div>
    );
  }

  // Group tables by zone for the card grid
  const zonesMap = new Map<string, Table[]>();
  tables.forEach((t) => {
    const zone = t.zone_name || 'Main Dining Hall';
    if (!zonesMap.has(zone)) zonesMap.set(zone, []);
    zonesMap.get(zone)!.push(t);
  });

  return (
    <div className={cn('space-y-8', className)}>
      {Array.from(zonesMap.entries()).map(([zone, zoneTables]) => (
        <div key={zone}>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            {zone}
            <span className="text-xs font-normal text-stone-500 dark:text-slate-400">
              ({zoneTables.length} tables)
            </span>
          </h3>

          {/* Card grid for non-coordinate floor plans; canvas for coordinate-based */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {zoneTables.map((tbl) => {
              const label = tbl.name || `Table ${tbl.table_number}`;
              const seats = tbl.seats || tbl.capacity || 4;
              const shape = (tbl.shape || 'SQUARE').toUpperCase();

              return (
                <button
                  key={tbl.id}
                  onClick={() => onSelectTable(tbl)}
                  className={cn(
                    'p-4 border transition-all cursor-pointer hover:shadow-lg group flex flex-col items-center justify-center gap-2 text-center',
                    SHAPE_CLASSES[shape] || 'rounded-2xl',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
                    tbl.isOccupied
                      ? 'border-amber-500/50 bg-amber-50/80 dark:bg-amber-500/5 hover:border-amber-500 hover:shadow-amber-500/10'
                      : 'border-stone-200 bg-white hover:border-emerald-500/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/50 hover:shadow-emerald-500/10'
                  )}
                  aria-label={`${label} — ${seats} seats, ${tbl.isOccupied ? 'occupied' : 'available'}, ${zone}`}
                >
                  {/* Table shape visual */}
                  <div
                    className={cn(
                      'w-16 h-16 flex items-center justify-center transition-all group-hover:scale-110',
                      shape === 'ROUND' ? 'rounded-full' : shape === 'RECTANGLE' ? 'rounded-lg w-20 h-14' : 'rounded-xl',
                      tbl.isOccupied
                        ? 'bg-amber-500/20 border-2 border-amber-400'
                        : 'bg-emerald-500/10 border-2 border-emerald-400/50'
                    )}
                  >
                    <span className={cn(
                      'font-bold text-lg',
                      tbl.isOccupied ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                    )}>
                      {label.replace(/^Table\s*/, '')}
                    </span>
                  </div>

                  {/* Table name */}
                  <div>
                    <p className={cn(
                      'font-bold text-sm transition-colors',
                      tbl.isOccupied
                        ? 'text-stone-900 dark:text-white'
                        : 'text-stone-700 dark:text-slate-300'
                    )}>
                      {label}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 text-stone-400" />
                      <span className="text-xs text-stone-500 dark:text-slate-400 font-mono">{seats}</span>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border',
                      tbl.isOccupied
                        ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    )}
                  >
                    {tbl.isOccupied ? 'SEATED' : 'FREE'}
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
