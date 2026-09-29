'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Store, ShoppingCart, Activity, LayoutDashboard } from 'lucide-react';

const tabs = [
  { title: 'Overview', href: '/ecommerce', icon: LayoutDashboard },
  { title: 'Channels', href: '/ecommerce/channels', icon: Store },
  { title: 'Online Orders', href: '/ecommerce/orders', icon: ShoppingCart },
  { title: 'Sync Logs', href: '/ecommerce/logs', icon: Activity },
];

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-0 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-600/20 flex items-center justify-center">
            <Store className="text-violet-600 dark:text-violet-400" size={18} />
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white font-semibold text-lg">E-commerce</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Omnichannel integration — WooCommerce & Shopify</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const isActive = tab.href === '/ecommerce' 
              ? pathname === '/ecommerce' 
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
                  isActive
                    ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-500 bg-violet-50 dark:bg-violet-500/5'
                    : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                )}
              >
                <Icon size={15} />
                {tab.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
        {children}
      </div>
    </div>
  );
}
