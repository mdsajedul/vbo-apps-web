'use client';

import { useEffect, useState } from 'react';
import { ecommerceApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  ShoppingCart, CheckCircle2, Clock, XCircle, 
  RefreshCw, ArrowLeft, Store, PackageCheck, DollarSign 
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FULFILLMENT_CONFIG: Record<string, { label: string; className: string }> = {
  UNFULFILLED: { label: 'Unfulfilled', className: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50' },
  PARTIALLY_FULFILLED: { label: 'Partial', className: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200/50' },
  FULFILLED: { label: 'Fulfilled', className: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50' },
  CANCELLED: { label: 'Cancelled', className: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50' },
};

const PAYMENT_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50' },
  PAID: { label: 'Paid', className: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50' },
  REFUNDED: { label: 'Refunded', className: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50' },
};

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfillmentFilter, setFulfillmentFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, [fulfillmentFilter, paymentFilter]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const data = await ecommerceApi.getOrders({
        fulfillment_status: fulfillmentFilter || undefined,
        payment_status: paymentFilter || undefined,
      });
      setOrders(data || []);
    } catch {
      toast.error('Failed to load online orders');
    } finally {
      setLoading(false);
    }
  }

  async function handleFulfill(id: string) {
    setFulfillingId(id);
    try {
      await ecommerceApi.fulfillOrder(id);
      toast.success('Order marked as fulfilled');
      fetchOrders();
    } catch {
      toast.error('Failed to fulfill order');
    } finally {
      setFulfillingId(null);
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
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Online Store Orders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fulfill incoming multichannel orders and synchronize status back to storefronts.
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
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="">All Fulfillment Status</option>
              <option value="UNFULFILLED">Unfulfilled</option>
              <option value="PARTIALLY_FULFILLED">Partial</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="">All Payment Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchOrders}
            className="h-8 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>Loading online orders...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              No online orders matching the selected status filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ORDER ID</th>
                    <th className="px-6 py-4 font-semibold">STORE CHANNEL</th>
                    <th className="px-6 py-4 font-semibold">CUSTOMER</th>
                    <th className="px-6 py-4 font-semibold">TOTAL AMOUNT</th>
                    <th className="px-6 py-4 font-semibold">PAYMENT</th>
                    <th className="px-6 py-4 font-semibold">FULFILLMENT</th>
                    <th className="px-6 py-4 font-semibold">SYNCED AT</th>
                    <th className="px-6 py-4 text-right font-semibold">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {orders.map((order) => {
                    const fulfillment = FULFILLMENT_CONFIG[order.fulfillment_status] || FULFILLMENT_CONFIG.UNFULFILLED;
                    const payment = PAYMENT_CONFIG[order.payment_status] || PAYMENT_CONFIG.PENDING;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                          #{order.external_order_number}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-purple-600 dark:text-purple-400">
                          {order.channel?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">{order.customer_name}</div>
                          {order.customer_email && <div className="text-slate-400 text-[11px] font-mono mt-0.5">{order.customer_email}</div>}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-900 dark:text-white">
                          ৳{Number(order.order_total).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${payment.className}`}>
                            {payment.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${fulfillment.className}`}>
                            {fulfillment.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                          {new Date(order.imported_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {order.fulfillment_status === 'UNFULFILLED' && (
                            <Button
                              size="sm"
                              onClick={() => handleFulfill(order.id)}
                              disabled={fulfillingId === order.id}
                              className="h-8 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>{fulfillingId === order.id ? 'Fulfilling...' : 'Fulfill'}</span>
                            </Button>
                          )}
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
