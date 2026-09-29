'use client';

import { useState, useEffect } from 'react';
import { Download, Package, ArrowLeft, Boxes, FileSpreadsheet, Building2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function InventoryValuationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/inventory/valuation');
      setData(res.data?.data || res.data);
    } catch (err) {
      console.error('Failed to fetch inventory report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const url = `http://localhost:3001/reports/inventory/valuation?format=csv`;
    const token = localStorage.getItem('token');
    
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a');
      const objectUrl = window.URL.createObjectURL(blob);
      a.href = objectUrl;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `inventory_valuation_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/inventory">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Inventory Asset Valuation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live valuation and capital tied up in stock across enterprise warehouse hubs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-500">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span>Calculating inventory valuation...</span>
          </div>
        </div>
      ) : (
        <>
          {/* 2 KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Total Tracked Items
                  </p>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {data?.summary?.total_items || 0}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Active SKU barcodes in branches</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shadow-2xs">
                  <Package className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Total Asset Value (Cost)
                  </p>
                  <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    ৳{data?.summary?.total_valuation ? (data.summary.total_valuation / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 }) : '0.00'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    As of: {data?.generated_at ? new Date(data.generated_at).toLocaleString() : 'Live'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                    <tr>
                      <th className="px-6 py-4 font-semibold">BRANCH LOCATION</th>
                      <th className="px-6 py-4 font-semibold">PRODUCT / VARIANT</th>
                      <th className="px-6 py-4 font-semibold">SKU CODE</th>
                      <th className="px-6 py-4 font-semibold text-right">QUANTITY ON HAND</th>
                      <th className="px-6 py-4 font-semibold text-right">UNIT COST (৳)</th>
                      <th className="px-6 py-4 font-semibold text-right">TOTAL ASSET VALUE (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data?.data?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                          No inventory stock valuation items found.
                        </td>
                      </tr>
                    ) : (
                      data?.data?.map((row: any, i: number) => (
                        <tr key={row.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {row.branch}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">
                            {row.name}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">
                            {row.sku}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-bold text-slate-900 dark:text-white text-right">
                            {row.quantity}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-400 text-right">
                            ৳{(row.cost_price / 100).toLocaleString('en-BD', {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                            ৳{(row.total_value / 100).toLocaleString('en-BD', {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
