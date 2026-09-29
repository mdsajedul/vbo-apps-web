'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Plus, Eye, Search, ShoppingBag, Truck, 
  Building2, Calendar, FileText, CheckCircle2, 
  Clock, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function ProcurementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination support
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    api.get('/procurement/orders').then(res => {
      setOrders(res.data?.data || res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredOrders = orders.filter(po => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      po.po_number?.toLowerCase().includes(q) ||
      po.supplier?.name?.toLowerCase().includes(q) ||
      po.branch?.name?.toLowerCase().includes(q) ||
      po.status?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Procurement orders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage supplier purchase orders, track shipment fulfillment, and audit goods receipts.
            </p>
          </div>
        </div>

        <PermissionGuard permission="procurement:create">
          <Link
            href="/procurement/new"
            className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create purchase order</span>
          </Link>
        </PermissionGuard>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Search & Filter Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by PO number, supplier, or branch..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
            />
          </div>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 font-mono self-start sm:self-auto">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-500">
              <Spinner className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
              <span className="text-xs">Loading procurement records...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60 dark:border-slate-700">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {searchQuery ? 'No matching purchase orders' : 'No purchase orders found'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {searchQuery ? 'Try adjusting your search filters' : 'Issue your first supplier replenishment order to start receiving inventory.'}
              </p>
              {!searchQuery && (
                <PermissionGuard permission="procurement:create">
                  <Link 
                    href="/procurement/new" 
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create first purchase order</span>
                  </Link>
                </PermissionGuard>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">Vendor / Supplier</th>
                    <th className="px-6 py-4">Destination</th>
                    <th className="px-6 py-4">Order Date</th>
                    <th className="px-6 py-4">Fulfillment Status</th>
                    <th className="px-6 py-4 text-right">Total Amount (৳ BDT)</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {paginatedOrders.map((po: any) => (
                    <tr key={po.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors group">
                      {/* PO Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                          {po.po_number}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {po.supplier?.name || 'Unassigned Vendor'}
                        </div>
                        {po.supplier?.email && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {po.supplier.email}
                          </div>
                        )}
                      </td>

                      {/* Destination Branch */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{po.branch?.name || 'Central Warehouse'}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {new Date(po.created_at).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(po.status)}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs font-bold text-slate-900 dark:text-white">
                        ৳ {(po.total_amount / 100).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link 
                          href={`/procurement/${po.id}`} 
                          className="inline-flex items-center gap-1.5 rounded-xl h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View audit</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredOrders.length > 0 && (
            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                totalItems={filteredOrders.length}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
