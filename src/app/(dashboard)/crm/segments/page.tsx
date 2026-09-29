'use client';

import { useState, useEffect } from 'react';
import { crmApi } from '@/lib/api';
import { 
  Plus, Users, User, ArrowLeft, DollarSign, 
  Receipt, Info, Tag, Layers, Check, X, Target 
} from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function CrmSegmentsPage() {
  const [segments, setSegments] = useState<any[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [segmentCustomers, setSegmentCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minSpent, setMinSpent] = useState<number | ''>('');
  const [minPurchases, setMinPurchases] = useState<number | ''>('');

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const data = await crmApi.getSegments();
      setSegments(data || []);
      if (data && data.length > 0) {
        setSelectedSegment(data[0]);
      }
    } catch (err) {
      console.error('Failed to load segments', err);
      toast.error('Failed to load customer segments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  // Fetch customers in selected segment
  useEffect(() => {
    async function loadSegmentCustomers() {
      if (!selectedSegment) {
        setSegmentCustomers([]);
        return;
      }
      try {
        setCustomersLoading(true);
        const data = await crmApi.getSegmentCustomers(selectedSegment.id);
        setSegmentCustomers(data || []);
      } catch (err) {
        console.error('Failed to fetch segment customers', err);
        toast.error('Failed to load customers for segment');
      } finally {
        setCustomersLoading(false);
      }
    }
    loadSegmentCustomers();
  }, [selectedSegment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Segment name is required');
      return;
    }

    try {
      const rules: any = {};
      if (minSpent !== '') {
        rules.min_spent = Math.round(Number(minSpent) * 100);
      }
      if (minPurchases !== '') {
        rules.min_purchases = Number(minPurchases);
      }

      const payload = {
        name,
        description,
        rules
      };

      await crmApi.createSegment(payload);
      toast.success('Segment created successfully');
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setMinSpent('');
      setMinPurchases('');
      fetchSegments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create segment');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/crm">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Customer Segments & Cohorts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated behavioral grouping based on lifetime spending and purchase frequency.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/crm/opportunities">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs"
            >
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>Deals Board</span>
            </Button>
          </Link>
          <PermissionGuard permission="crm:create">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Segment</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-500">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span>Loading segments...</span>
          </div>
        </div>
      ) : segments.length === 0 ? (
        <div className="p-16 text-center text-slate-500">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">No segments defined</p>
            <p className="text-xs text-slate-400">Define customer target groups based on spending rules.</p>
            <Button 
              size="sm" 
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Create first segment
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Segments list on left */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
              Active Cohort Profiles
            </span>
            <div className="space-y-2">
              {segments.map((seg) => {
                const active = selectedSegment?.id === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => setSelectedSegment(seg)}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${
                      active
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      active 
                        ? 'bg-indigo-600 text-white border-indigo-700' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-bold text-xs ${active ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}>
                        {seg.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {seg.description || 'No description provided'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Segment Details & Matching Customers on right */}
          <div className="md:col-span-2 space-y-6">
            {selectedSegment && (
              <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70 shadow-xs">
                {/* Segment Header Info */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {selectedSegment.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {selectedSegment.description || 'Automated audience cohort rule.'}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200/50 rounded-full">
                      {segmentCustomers.length} qualified
                    </span>
                  </div>

                  {/* Rules overview */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      Criteria:
                    </span>
                    {selectedSegment.rules?.min_spent !== undefined && (
                      <span className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
                        Min Spent: ৳ {(selectedSegment.rules.min_spent / 100).toLocaleString('en-BD')}
                      </span>
                    )}
                    {selectedSegment.rules?.min_purchases !== undefined && (
                      <span className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
                        Min Orders: {selectedSegment.rules.min_purchases}
                      </span>
                    )}
                    {(!selectedSegment.rules || Object.keys(selectedSegment.rules).length === 0) && (
                      <span className="text-slate-400 text-xs">All Customers</span>
                    )}
                  </div>
                </div>

                {/* Customers List */}
                <CardContent className="p-0">
                  {customersLoading ? (
                    <div className="p-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>Evaluating cohort members...</span>
                      </div>
                    </div>
                  ) : segmentCustomers.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 text-xs">
                      No customer accounts currently match this segment's threshold rules.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {segmentCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs">
                              {cust.name?.slice(0, 2).toUpperCase() || 'CU'}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{cust.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{cust.phone || cust.email || 'No contact info'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 text-xs">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Receipt className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold">{cust.total_purchases || 0} orders</span>
                            </div>
                            <div className="flex items-center gap-1 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>৳ {((cust.total_spent || 0) / 100).toLocaleString('en-BD')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create Segment Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Define Customer Segment
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Segment Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. High-Value VIP Clients"
                  className="h-10 rounded-xl text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Customers who spent more than ৳ 10,000 or ordered 5+ times."
                  rows={2}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">Behavioral Qualification Rules</label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Min Total Spent (৳)</label>
                    <Input
                      type="number"
                      value={minSpent}
                      onChange={(e) => setMinSpent(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="10000"
                      className="h-10 rounded-xl text-xs font-mono border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Min Orders Count</label>
                    <Input
                      type="number"
                      value={minPurchases}
                      onChange={(e) => setMinPurchases(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="5"
                      className="h-10 rounded-xl text-xs font-mono border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-5 shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Create Segment</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
