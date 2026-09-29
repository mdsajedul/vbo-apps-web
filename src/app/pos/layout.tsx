"use client"
import React from 'react';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans select-none">
      {children}
    </div>
  );
}
