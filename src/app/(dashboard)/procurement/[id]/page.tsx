'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, Truck, Package, PackageCheck, 
  Building2, Calendar, FileText, CheckCircle2, 
  Clock, Coins, Check 
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { cn } from '@/lib/utils';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grnFormOpen, setGrnFormOpen] = useState(false);
  const [grnItems, setGrnItems] = useState<any[]>([]);
  const [submittingGrn, setSubmittingGrn] = useState(false);

  useEffect(() => {
    api.get(`/procurement/orders/${params.id}`).then(res => {
      const data = res.data?.data || res.data;
      setPo(data);
      if (data?.items) {
        setGrnItems(data.items.map((i: any) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          name: i.product?.name,
          remaining_qty: i.quantity - (i.received_qty || 0),
          received_qty: 0,
          unit_cost: (i.unit_cost || 0) / 100
        })));
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast.error('Failed to load purchase order details');
      setLoading(false);
    });
  }, [params.id]);

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReceive = grnItems
      .filter(i => i.received_qty > 0)
      .map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        received_qty: i.received_qty,
        unit_cost: Math.round(i.unit_cost * 100)
      }));

    if (itemsToReceive.length === 0) {
      toast.error('Specify at least 1 received quantity');
      return;
    }

    setSubmittingGrn(true);
    try {
      const payload = {
        po_id: po.id,
        branch_id: po.branch_id,
        items: itemsToReceive
      };
      
      await api.post('/procurement/grn', payload);
      toast.success('Goods Receipt Note (GRN) created successfully');
      setGrnFormOpen(false);
      
      // Refresh PO
      const res = await api.get(`/procurement/orders/${params.id}`);
      const refreshed = res.data?.data || res.data;
      setPo(refreshed);
      if (refreshed?.items) {
        setGrnItems(refreshed.items.map((i: any) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          name: i.product?.name,
          remaining_qty: i.quantity - (i.received_qty || 0),
          received_qty: 0,
          unit_cost: (i.unit_cost || 0) / 100
        })));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to receive goods');
    } finally {
      setSubmittingGrn(false);
    }
  };

  if (loading || !po) {
    return <PageLoader />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Completed
          </span>
        );
      case 'PARTIAL_RECEIPT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Partial Receipt
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-200/50 dark:border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Pending Receipt
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link 
            href="/procurement" 
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200/60 dark:border-slate-700 shadow-2xs transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight font-mono">
                  {po.po_number}
                </h2>
                {getStatusBadge(po.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Issued on {new Date(po.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {po.status !== 'COMPLETED' && po.status !== 'CANCELLED' && (
            <PermissionGuard permission="procurement:update">
              <Button 
                onClick={() => setGrnFormOpen(true)}
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 shadow-xs flex items-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Receive goods (GRN)</span>
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* 2-Column Info Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supplier Info */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Supplier & Vendor Details</h3>
          </div>
          <CardContent className="p-6 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Vendor Name</span>
              <span className="font-bold text-slate-900 dark:text-white">{po.supplier?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Contact Person</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{po.supplier?.contact_person || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Email Address</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{po.supplier?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Phone Contact</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{po.supplier?.phone || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
            <Coins className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Order Valuation & Destination</h3>
          </div>
          <CardContent className="p-6 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Destination Branch</span>
              <span className="font-bold text-slate-900 dark:text-white">{po.branch?.name || 'Central Warehouse'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Total Ordered Items</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{po.items?.length || 0} Products</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Order Placed Date</span>
              <span className="text-slate-700 dark:text-slate-300">{new Date(po.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Gross Order Valuation</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                ৳ {((po.total_amount || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Ordered Table Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Line item fulfillment status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison between ordered quantities and verified warehouse stock receipts.
            </p>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Product name</th>
                  <th className="px-6 py-4 text-center">Ordered Qty</th>
                  <th className="px-6 py-4 text-center">Received Qty</th>
                  <th className="px-6 py-4 text-center">Remaining</th>
                  <th className="px-6 py-4 text-right">Unit Rate (৳)</th>
                  <th className="px-6 py-4 text-right">Subtotal (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {po.items?.map((item: any) => {
                  const rem = item.quantity - (item.received_qty || 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.product?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SKU: {item.product?.sku || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {item.received_qty || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs font-bold">
                        <span className={rem === 0 ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400'}>
                          {rem}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        ৳ {((item.unit_cost || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                        ৳ {((item.total_cost || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* GRN Modal Dialog */}
      <Dialog open={grnFormOpen} onOpenChange={setGrnFormOpen}>
        <DialogContent className="sm:max-w-2xl p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 max-h-[90vh] flex flex-col">
          <form onSubmit={handleReceiveGoods} className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                    <PackageCheck className="w-3.5 h-3.5" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Create Goods Receipt Note (GRN)
                  </DialogTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify stock arrival quantities and actual invoice unit rates.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Remaining</th>
                      <th className="p-3 text-center w-28">Receiving Qty</th>
                      <th className="p-3 text-right w-32">Actual Unit Cost (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {grnItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {item.product?.name}
                        </td>
                        <td className="p-3 text-center font-mono font-medium text-slate-600 dark:text-slate-400">
                          {item.remaining_qty}
                        </td>
                        <td className="p-3">
                          <Input 
                            type="number" 
                            min="0" 
                            max={item.remaining_qty}
                            className="h-8 text-center font-mono text-xs rounded-lg"
                            value={item.received_qty || ''}
                            placeholder="0"
                            onChange={e => {
                              const newItems = [...grnItems];
                              newItems[idx].received_qty = parseInt(e.target.value, 10) || 0;
                              setGrnItems(newItems);
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            className="h-8 text-right font-mono text-xs rounded-lg"
                            value={item.unit_cost || ''}
                            placeholder="0.00"
                            onChange={e => {
                              const newItems = [...grnItems];
                              newItems[idx].unit_cost = parseFloat(e.target.value) || 0;
                              setGrnItems(newItems);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setGrnFormOpen(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submittingGrn}
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {submittingGrn ? 'Receiving...' : 'Submit GRN'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
