'use client';

import { useEffect, useState } from 'react';
import { ecommerceApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Activity, CheckCircle2, XCircle, Clock, 
  RefreshCw, ArrowLeft, ArrowUpRight, ArrowDownLeft, 
  Store, ShoppingCart 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SUCCESS: { label: 'Success', className: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50' },
  FAILED: { label: 'Failed', className: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50' },
  SKIPPED: { label: 'Skipped', className: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50' },
};

export default function SyncLogsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ecommerceApi.getChannels().then((data) => {
      const chs = data || [];
      setChannels(chs);
      if (chs.length > 0) setSelectedChannel(chs[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedChannel) fetchLogs();
  }, [selectedChannel]);

  async function fetchLogs() {
    if (!selectedChannel) return;
    setLoading(true);
    try {
      const data = await ecommerceApi.getLogs(selectedChannel, 200);
      setLogs(data || []);
    } catch {
      toast.error('Failed to load sync logs');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/ecommerce">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/20 shadow-2xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              E-Commerce Sync Audit Logs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live audit trail of bidirectional payload syncs, payload runtimes, and error stacks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/ecommerce/channels">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-purple-500" />
              <span>Channels</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <Store className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Store Channel:</span>
            {channels.length > 0 ? (
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                {channels.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-400">No channels</span>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLogs}
            className="h-8 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </Button>
        </div>

        <CardContent className="p-0">
          {!selectedChannel ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              No store channels configured yet.
            </div>
          ) : loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>Loading sync telemetry records...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              No sync log events registered for this channel yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">STATUS</th>
                    <th className="px-6 py-4 font-semibold">ENTITY TYPE</th>
                    <th className="px-6 py-4 font-semibold">SYNC DIRECTION</th>
                    <th className="px-6 py-4 font-semibold">BOS ID</th>
                    <th className="px-6 py-4 font-semibold">EXTERNAL ID</th>
                    <th className="px-6 py-4 font-semibold">RUNTIME</th>
                    <th className="px-6 py-4 font-semibold">ERROR DETAILS</th>
                    <th className="px-6 py-4 text-right font-semibold">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {logs.map((log) => {
                    const status = STATUS_CONFIG[log.status] || STATUS_CONFIG.SKIPPED;
                    const isPush = log.direction === 'PUSH';
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {log.entity_type}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            {isPush ? <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-purple-500" />}
                            {isPush ? 'BOS → Store' : 'Store → BOS'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          {log.entity_id ? log.entity_id.slice(0, 8) + '…' : '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {log.external_id || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {log.duration_ms}ms
                        </td>
                        <td className="px-6 py-4 text-xs text-rose-500 max-w-[200px] truncate" title={log.error_message}>
                          {log.error_message || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono text-right">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
