'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { warehouseApi, branchesApi } from '@/lib/api';
import { 
  Plus, ArrowRightLeft, Layers, Box, Building2, 
  Warehouse, ShieldCheck, Tag, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function WarehouseDashboard() {
  const [zones, setZones] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    branchesApi.getAll().then(res => {
      const branchesData = res.data || res || [];
      setBranches(branchesData);
      if (branchesData.length > 0) {
        setSelectedBranch(branchesData[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;
    
    setLoading(true);
    Promise.all([
      warehouseApi.getZones({ branch_id: selectedBranch }),
      warehouseApi.getBins({ branch_id: selectedBranch })
    ]).then(([zonesRes, binsRes]) => {
      setZones(zonesRes || []);
      setBins(binsRes || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [selectedBranch]);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Warehouse & storage
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize fulfillment zones, manage bin shelf locations, and execute internal transfers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/warehouse/transfer">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-teal-500/30"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" />
              <span>Bin transfer</span>
            </Button>
          </Link>
          <PermissionGuard permission="warehouse:create">
            <Link href="/warehouse/zones/new">
              <Button 
                variant="outline"
                className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Add zone</span>
              </Button>
            </Link>
          </PermissionGuard>
          <PermissionGuard permission="warehouse:create">
            <Link href="/warehouse/bins/new">
              <Button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs">
                <Plus className="w-4 h-4" />
                <span>Add bin</span>
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Branch Selector Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200/60 dark:border-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Warehouse Location Filter
              </span>
              <span className="text-[11px] text-slate-400">
                Displaying storage zones & bins for the active operating branch
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select 
              className="px-3.5 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs min-w-[200px]"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Grid: Zones vs Bins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Zones Panel */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Warehouse Zones
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
              {zones.length} Zones
            </span>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="inline-flex items-center gap-2 text-xs">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>Loading zones...</span>
                </div>
              </div>
            ) : zones.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No storage zones defined for this branch yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">ZONE NAME</th>
                      <th className="px-6 py-3.5 font-semibold">TYPE</th>
                      <th className="px-6 py-3.5 text-right font-semibold">TOTAL BINS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {zones.map((zone: any) => (
                      <tr key={zone.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-xs">
                          {zone.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            {zone.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                          {zone._count?.bins || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bins Panel */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Box className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bins & Physical Stock
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {bins.length} Bins
            </span>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="inline-flex items-center gap-2 text-xs">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>Loading bins...</span>
                </div>
              </div>
            ) : bins.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No bins defined for this branch yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">BIN & BARCODE</th>
                      <th className="px-6 py-3.5 font-semibold">ZONE</th>
                      <th className="px-6 py-3.5 text-right font-semibold">ITEMS STOCKED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {bins.map((bin: any) => (
                      <tr key={bin.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {bin.name}
                          </div>
                          {bin.barcode && (
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {bin.barcode}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                          {bin.zone?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {bin.stocks && bin.stocks.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {bin.stocks.length} Items
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Empty</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
