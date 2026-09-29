'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, TrendingUp, FolderTree, Tag } from 'lucide-react';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Dashboard', href: '/crm', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Leads', href: '/crm/leads', icon: <Users className="w-4 h-4" /> },
    { name: 'Opportunities', href: '/crm/opportunities', icon: <TrendingUp className="w-4 h-4" /> },
    { name: 'Pipelines', href: '/crm/pipelines', icon: <FolderTree className="w-4 h-4" /> },
    { name: 'Segments', href: '/crm/segments', icon: <Tag className="w-4 h-4" /> },
  ];

  const isActive = (href: string) => {
    if (href === '/crm') {
      return pathname === '/crm';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CRM Workspace</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your leads, tracking opportunities, custom pipelines, and segments.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg self-start md:self-auto shadow-inner">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
