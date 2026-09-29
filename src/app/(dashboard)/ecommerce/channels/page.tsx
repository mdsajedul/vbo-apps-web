'use client';

import { useEffect, useState } from 'react';
import { ecommerceApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus, Plug, RefreshCw, Package, Archive, ShoppingCart,
  CheckCircle2, XCircle, AlertCircle, Pause, Wifi, WifiOff,
  Trash2, Settings, Store, ArrowLeft, ArrowUpRight, Check, X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';

const PLATFORM_LABELS: Record<string, string> = {
  WOOCOMMERCE: 'WooCommerce',
  SHOPIFY: 'Shopify',
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  ACTIVE: { label: 'Active', icon: CheckCircle2, className: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50' },
  PAUSED: { label: 'Paused', icon: Pause, className: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50' },
  ERROR: { label: 'Error', icon: AlertCircle, className: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50' },
  DISCONNECTED: { label: 'Disconnected', icon: WifiOff, className: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
};

export default function ChannelsPage() {
  const confirm = useConfirm();
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    platform: 'WOOCOMMERCE',
    branch_id: '',
    api_url: '',
    api_key: '',
    api_secret: '',
    sync_interval_minutes: 15,
    inventory_safety_buffer: 0,
  });

  useEffect(() => { fetchChannels(); }, []);

  async function fetchChannels() {
    try {
      setLoading(true);
      const data = await ecommerceApi.getChannels();
      setChannels(data || []);
    } catch {
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ecommerceApi.createChannel(form);
      toast.success('Channel created! Test the connection to activate it.');
      setShowModal(false);
      setForm({ name: '', platform: 'WOOCOMMERCE', branch_id: '', api_url: '', api_key: '', api_secret: '', sync_interval_minutes: 15, inventory_safety_buffer: 0 });
      fetchChannels();
    } catch {
      toast.error('Failed to create channel');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      await ecommerceApi.testConnection(id);
      toast.success('Connection successful! Channel is now ACTIVE.');
      fetchChannels();
    } catch {
      toast.error('Connection failed. Please check your API credentials.');
    } finally {
      setTestingId(null);
    }
  }

  async function handleSync(id: string, type: 'products' | 'inventory' | 'orders') {
    setSyncingId(`${id}:${type}`);
    try {
      if (type === 'products') await ecommerceApi.triggerProductSync(id);
      if (type === 'inventory') await ecommerceApi.triggerInventorySync(id);
      if (type === 'orders') await ecommerceApi.triggerOrderPull(id);
      toast.success(`${type} sync job queued!`);
    } catch {
      toast.error('Failed to queue sync job');
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDisconnect(id: string, channelName?: string) {
    const ok = await confirm({
      title: 'Disconnect Storefront Channel',
      description: `Are you sure you want to disconnect ${channelName ? `"${channelName}"` : 'this channel'}? Sync history will be preserved.`,
      confirmText: 'Disconnect Channel',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await ecommerceApi.deleteChannel(id);
      toast.success('Channel disconnected');
      fetchChannels();
    } catch {
      toast.error('Failed to disconnect channel');
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
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Connected Online Channels
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage API credentials, inventory safety buffers, and synchronization intervals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/ecommerce/orders">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
              <span>Web Orders</span>
            </Button>
          </Link>
          <PermissionGuard permission="ecommerce:create">
            <Button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Store</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Channel Cards */}
      {loading ? (
        <div className="p-20 text-center text-slate-500">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span>Loading connected channels...</span>
          </div>
        </div>
      ) : channels.length === 0 ? (
        <div className="p-16 text-center text-slate-500">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <Plug className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">No channels connected</p>
            <p className="text-xs text-slate-400">Connect your WooCommerce or Shopify storefront to sync goods and orders.</p>
            <Button 
              size="sm" 
              onClick={() => setShowModal(true)}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Connect your first store
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {channels.map((ch) => {
            const status = STATUS_CONFIG[ch.status] || STATUS_CONFIG.DISCONNECTED;
            const StatusIcon = status.icon;
            return (
              <Card key={ch.id} className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70 p-5 space-y-4">
                {/* Channel Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ch.name}</h3>
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border', status.className)}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{PLATFORM_LABELS[ch.platform] || ch.platform} · {ch.api_url}</p>
                    </div>
                  </div>
                  <PermissionGuard permission="ecommerce:delete">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDisconnect(ch.id)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                      title="Disconnect channel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </PermissionGuard>
                </div>

                {/* Sync Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Last Product Sync', value: ch.last_product_sync_at },
                    { label: 'Last Inventory Sync', value: ch.last_inventory_sync_at },
                    { label: 'Last Order Pull', value: ch.last_order_sync_at },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-slate-800 dark:text-slate-200 text-xs font-mono font-medium">
                        {item.value ? new Date(item.value).toLocaleString() : 'Never Synced'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(ch.id)}
                    disabled={testingId === ch.id}
                    className="h-8 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs border-slate-200 dark:border-slate-700"
                  >
                    <Wifi className="w-3.5 h-3.5 text-slate-500" />
                    <span>{testingId === ch.id ? 'Testing...' : 'Test Connection'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(ch.id, 'products')}
                    disabled={!!syncingId}
                    className="h-8 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs border-slate-200 dark:border-slate-700"
                  >
                    <Package className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Sync Products</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(ch.id, 'inventory')}
                    disabled={!!syncingId}
                    className="h-8 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs border-slate-200 dark:border-slate-700"
                  >
                    <Archive className="w-3.5 h-3.5 text-teal-600" />
                    <span>Sync Inventory</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(ch.id, 'orders')}
                    disabled={!!syncingId}
                    className="h-8 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs border-slate-200 dark:border-slate-700"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />
                    <span>Pull Orders</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Channel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Connect Storefront Channel</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Channel Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Main WooCommerce Shop"
                    required
                    className="h-10 rounded-xl text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Platform Platform *</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="WOOCOMMERCE">WooCommerce (REST API)</option>
                    <option value="SHOPIFY">Shopify (Admin API)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Store URL *</label>
                <Input
                  value={form.api_url}
                  onChange={(e) => setForm({ ...form, api_url: e.target.value })}
                  placeholder="https://yourstore.com"
                  required
                  className="h-10 rounded-xl text-xs font-mono border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">API Key / Consumer Key *</label>
                  <Input
                    value={form.api_key}
                    onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                    placeholder="ck_..."
                    required
                    className="h-10 rounded-xl text-xs font-mono border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">API Secret / Consumer Secret *</label>
                  <Input
                    type="password"
                    value={form.api_secret}
                    onChange={(e) => setForm({ ...form, api_secret: e.target.value })}
                    placeholder="cs_..."
                    required
                    className="h-10 rounded-xl text-xs font-mono border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-5 shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Connect Channel</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
