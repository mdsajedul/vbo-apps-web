'use client';

import React from 'react';

interface PosHeaderProps {
  /** Logo icon element */
  logo?: React.ReactNode;
  /** Brand name display */
  brandName?: string;
  /** Tab definitions */
  tabs: Array<{ id: string; label: string; visible?: boolean }>;
  /** Currently active tab id */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (tabId: string) => void;
  /** Action chips on the right side */
  actions?: React.ReactNode;
  /** Mobile menu trigger */
  mobileMenuTrigger?: React.ReactNode;
  /** Theme toggle rendered inside header */
  themeToggle?: React.ReactNode;
  /** Accent color class (e.g. 'amber', 'blue') */
  accentColor?: string;
}

export function PosHeader({
  logo,
  brandName = 'BOS POS',
  tabs,
  activeTab,
  onTabChange,
  actions,
  mobileMenuTrigger,
  themeToggle,
  accentColor = 'amber',
}: PosHeaderProps) {
  const accentClass = {
    amber: {
      active: 'border-amber-500 text-amber-500 dark:text-amber-400 bg-stone-200/50 dark:bg-slate-800/60',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    blue: {
      active: 'border-blue-500 text-blue-500 dark:text-blue-400 bg-slate-200/50 dark:bg-slate-800/60',
      icon: 'text-blue-500 dark:text-blue-400',
    },
  }[accentColor] || {
    active: 'border-amber-500 text-amber-500 dark:text-amber-400 bg-stone-200/50 dark:bg-slate-800/60',
    icon: 'text-amber-500 dark:text-amber-400',
  };

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 shadow-sm transition-colors duration-200">
      {/* Left: Logo */}
      <div className="flex items-center space-x-2 h-full">
        {logo}
        <span className="font-bold text-base sm:text-lg tracking-tight text-stone-900 dark:text-white">
          {brandName}
        </span>
      </div>

      {/* Center: Navigation Tabs */}
      <div className="flex items-center h-full space-x-0.5 sm:space-x-1" role="tablist">
        {tabs.filter((t) => t.visible !== false).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`h-full px-2.5 sm:px-5 text-xs font-bold transition-all flex items-center border-b-2 ${
              activeTab === tab.id
                ? `${accentClass.active} font-extrabold`
                : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right: Action Chips */}
      <div className="flex items-center space-x-2">
        {actions}
        {mobileMenuTrigger}
        {themeToggle && (
          <div className="hidden sm:block p-0.5 bg-stone-200/80 dark:bg-slate-800 border border-stone-300/60 dark:border-slate-700 rounded-xl shadow-sm">
            {themeToggle}
          </div>
        )}
      </div>
    </header>
  );
}
