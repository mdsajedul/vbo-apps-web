'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { formatBDT, cn } from '@/lib/utils';

interface DishCardProps {
  id: string;
  name: string;
  sellingPrice: number; // paisa
  imageUrl?: string;
  categoryName?: string;
  dietaryTags?: string[];
  is86d?: boolean;
  onClick: (item: any) => void;
  item: any; // pass through to onClick
}

const DIETARY_MAP: Record<string, { emoji: string; label: string }> = {
  vegetarian: { emoji: '🌱', label: 'V' },
  vegan: { emoji: '🌿', label: 'VG' },
  'gluten-free': { emoji: '🌾', label: 'GF' },
  spicy: { emoji: '🌶️', label: 'Spicy' },
  halal: { emoji: '✅', label: 'Halal' },
};

export function DishCard({
  id,
  name,
  sellingPrice,
  imageUrl,
  categoryName,
  dietaryTags,
  is86d = false,
  onClick,
  item,
}: DishCardProps) {
  const imgSrc = imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${imageUrl}` : null;

  const tags = (dietaryTags || []).filter((t) => DIETARY_MAP[t.toLowerCase()]);

  return (
    <button
      onClick={() => !is86d && onClick(item)}
      disabled={is86d}
      className={cn(
        'w-full text-left bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-200',
        'hover:-translate-y-1 hover:border-amber-500/80 shadow-sm hover:shadow-lg dark:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-amber-500/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
        'active:scale-[0.98]',
        is86d && 'opacity-70 cursor-not-allowed hover:translate-y-0'
      )}
      aria-label={`${is86d ? 'Out of stock: ' : 'Add '}${name} — ৳${formatBDT(sellingPrice)}`}
    >
      {/* Image Banner — shorter on desktop (aspect-video), slightly shorter on mobile */}
      <div className="aspect-[16/11] md:aspect-video w-full bg-[#f2f4f6] dark:bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-gray-200/60 dark:border-slate-800/50">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-emerald-600/30 to-emerald-800/40 flex items-center justify-center">
            <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400 drop-shadow-md">
              {name ? name.charAt(0).toUpperCase() : 'D'}
            </span>
          </div>
        )}

        {/* Dietary Badges */}
        {tags.length > 0 && (
          <div className="absolute top-1.5 left-1.5 flex gap-1">
            {tags.map((tag) => {
              const def = DIETARY_MAP[tag.toLowerCase()];
              return def ? (
                <span
                  key={tag}
                  className="px-1 py-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md text-[10px] font-bold text-stone-700 dark:text-slate-300 shadow-sm"
                  title={tag}
                >
                  {def.emoji}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* 86'd Overlay */}
        {is86d && (
          <div className="absolute inset-0 bg-stone-900/80 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold font-mono rounded-lg tracking-wider uppercase shadow-lg">
              86'd — Out of Stock
            </span>
          </div>
        )}

        {/* Price Badge (Stitch Style) */}
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-[#2d3133]/90 text-white backdrop-blur-sm font-bold font-mono text-[12px] sm:text-[13px] px-2 py-0.5 sm:py-1 rounded shadow-sm">
          ৳ {formatBDT(sellingPrice)}
        </div>
      </div>

      {/* Info */}
      <div className="p-2 sm:p-3 flex flex-col gap-0.5 sm:gap-1">
        <h4 className="font-semibold text-[13px] sm:text-[14px] text-[#191c1e] dark:text-white line-clamp-2 leading-tight">
          {name}
        </h4>
        {categoryName && (
          <span className="text-[11px] sm:text-[12px] text-[#6c7a71] dark:text-slate-400 flex items-center gap-1 line-clamp-1">
            <Tag className="w-3 h-3 text-[#006c49] shrink-0" />
            {categoryName}
          </span>
        )}
      </div>
    </button>
  );
}
