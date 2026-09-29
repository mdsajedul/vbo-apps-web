'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BarChart3, FileText, Calendar, ArrowRightLeft, 
  LayoutGrid, Wrench 
} from 'lucide-react';

import { useLanguage } from '@/i18n';

export default function BiReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { name: t('bi.layout.tab_builder'), href: '/reports/bi', icon: <Wrench className="w-3.5 h-3.5" /> },
    { name: t('bi.layout.tab_templates'), href: '/reports/bi/templates', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { name: t('bi.layout.tab_saved'), href: '/reports/bi/saved', icon: <FileText className="w-3.5 h-3.5" /> },
    { name: t('bi.layout.tab_schedules'), href: '/reports/bi/schedules', icon: <Calendar className="w-3.5 h-3.5" /> },
    { name: t('bi.layout.tab_comparative'), href: '/reports/bi/comparative', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/20 shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('bi.layout.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('bi.layout.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0",
                isActive
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              )}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
