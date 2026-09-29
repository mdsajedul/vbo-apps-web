'use client';

import { 
  Activity, ArrowUpRight, Store, ShoppingCart, 
  Repeat, Globe, CheckCircle2, AlertTriangle, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EcommerceOverviewPage() {
  const stats = [
    { title: 'Connected Channels', value: '2', icon: Store, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { title: 'Total Orders Synced', value: '1,248', icon: ShoppingCart, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Sync Health & Uptime', value: '100%', icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/20 shadow-2xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              E-Commerce & Multichannel Sync
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automate bidirectional product, inventory, and order syncing across WooCommerce and Shopify.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/ecommerce/channels">
            <Button 
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Store className="w-4 h-4" />
              <span>Manage Channels</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {stat.value}
                  </h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs ${stat.bg} ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Storefront Actions</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Quick triggers</span>
          </div>

          <CardContent className="p-5 space-y-3">
            <Link href="/ecommerce/channels" className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/60 bg-white dark:bg-slate-900/60 hover:bg-purple-50/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">Manage Storefront Channels</p>
                  <p className="text-[11px] text-slate-400">Add or configure WooCommerce & Shopify API webhooks</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </Link>
            
            <Link href="/ecommerce/orders" className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800/60 bg-white dark:bg-slate-900/60 hover:bg-indigo-50/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">Incoming Web Orders</p>
                  <p className="text-[11px] text-slate-400">Track and fulfill multichannel orders with inventory auto-deduct</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sync Telemetry</h3>
            </div>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
            </span>
          </div>

          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">All Channels Operational</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
              Automated background workers are keeping stock counts, catalogs, and customer orders synchronized.
            </p>
            <Link href="/ecommerce/logs" className="mt-4">
              <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 shadow-2xs">
                View Detailed Sync Logs &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
