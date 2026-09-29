'use client';

import { useState, useEffect } from 'react';
import { crmApi } from '@/lib/api';
import { useMasterData } from '@/hooks/useMasterData';
import { 
  Search, Plus, Edit2, Trash2, CheckCircle2, 
  Upload, AlertCircle, Sparkles, Users, ArrowLeft, 
  Phone, Mail, Building2, Check, X, ArrowRight, Eye 
} from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';

const leadSchema = z.object({
  first_name: z.string().min(1, 'First Name is required'),
  last_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  source: z.string().min(1, 'Source is required'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export default function CrmLeadsPage() {
  const confirm = useConfirm();
  const { data: leadSources, getLabel: getLeadSourceLabel } = useMasterData('LEAD_SOURCE');
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company_name: '',
      source: 'OTHER',
      status: 'NEW',
      notes: ''
    }
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getLeads({
        q: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      setLeads(result.data || []);
      if (result.meta) {
        setTotalItems(result.meta.total);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load CRM leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, sourceFilter, currentPage, itemsPerPage]);

  const onSubmit = async (data: LeadFormValues) => {
    try {
      const payload = {
        first_name: data.first_name.trim(),
        last_name: data.last_name?.trim() || undefined,
        company_name: data.company_name?.trim() || undefined,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        source: data.source,
        status: data.status,
        notes: data.notes?.trim() || undefined,
      };

      if (editingId) {
        await crmApi.updateLead(editingId, payload);
        toast.success('Lead updated successfully');
      } else {
        await crmApi.createLead(payload);
        toast.success('Lead created successfully');
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save lead');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Lead',
      description: `Are you sure you want to delete lead "${name}"? All touchpoint history for this lead will be removed.`,
      confirmText: 'Delete Lead',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await crmApi.deleteLead(id);
      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete lead');
    }
  };

  const handleConvert = async (id: string) => {
    try {
      await crmApi.convertLead(id);
      toast.success('Lead converted to Customer successfully!');
      fetchLeads();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to convert lead');
    }
  };

  const handleImport = async () => {
    try {
      let parsed: any[];
      try {
        parsed = JSON.parse(importJson);
        if (!Array.isArray(parsed)) {
          throw new Error('Must be an array of objects');
        }
      } catch (err) {
        toast.error('Invalid JSON structure. Please check and format correctly.');
        return;
      }

      const res = await crmApi.importLeads(parsed);
      toast.success(`Import complete! Imported: ${res.imported}, Warnings: ${res.warnings?.length || 0}`);
      setIsImportModalOpen(false);
      setImportJson('');
      fetchLeads();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import leads');
    }
  };

  const openModal = (lead?: any) => {
    if (lead) {
      setEditingId(lead.id);
      form.reset({
        first_name: lead.first_name,
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company_name: lead.company_name || '',
        source: lead.source || 'OTHER',
        status: lead.status || 'NEW',
        notes: lead.notes || '',
      });
    } else {
      setEditingId(null);
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        source: 'OTHER',
        status: 'NEW',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20';
      case 'CONTACTED':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20';
      case 'QUALIFIED':
        return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20';
      case 'CONVERTED':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20';
      case 'LOST':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/crm">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Leads & Prospects
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acquire, score, and nurture inbound customer leads into active sales deals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <PermissionGuard permission="crm:create">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-slate-300"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Leads</span>
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="crm:create">
            <Button
              onClick={() => openModal()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search leads by name, email, company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="LOST">Lost</option>
              <option value="CONVERTED">Converted</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="">All Sources</option>
              {leadSources.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>Loading leads...</span>
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">No leads found</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  {search ? `No leads matching "${search}".` : 'Create your first lead to start building your sales pipeline.'}
                </p>
                <Button 
                  size="sm" 
                  onClick={() => openModal()}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  Create first lead
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">PROSPECT NAME</th>
                    <th className="px-6 py-4 font-semibold">COMPANY</th>
                    <th className="px-6 py-4 font-semibold">CONTACT INFO</th>
                    <th className="px-6 py-4 font-semibold">LEAD SCORE</th>
                    <th className="px-6 py-4 font-semibold">STATUS</th>
                    <th className="px-6 py-4 text-right font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/crm/leads/${lead.id}`} className="hover:underline">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {lead.first_name} {lead.last_name}
                          </div>
                        </Link>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(lead.created_at).toLocaleDateString()} via <span className="font-medium text-slate-600 dark:text-slate-300">{getLeadSourceLabel(lead.source, lead.source)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {lead.company_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-mono text-slate-700 dark:text-slate-300">{lead.phone || '-'}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{lead.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-bold font-mono text-xs">
                          <Sparkles className={`w-3.5 h-3.5 ${getScoreColor(lead.score || 0)}`} />
                          <span className={getScoreColor(lead.score || 0)}>{lead.score || 0} / 100</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {lead.status !== 'CONVERTED' && (
                            <PermissionGuard permission="crm:update">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConvert(lead.id)}
                                className="h-8 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 shadow-2xs gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Convert</span>
                              </Button>
                            </PermissionGuard>
                          )}
                          <Link href={`/crm/leads/${lead.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 px-2.5 shadow-2xs gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <PermissionGuard permission="crm:update">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openModal(lead)}
                              className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 px-2.5 shadow-2xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="crm:delete">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(lead.id, `${lead.first_name} ${lead.last_name || ''}`)}
                              className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && leads.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage) || 1}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                totalItems={totalItems}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Lead Details' : 'Create New Prospect'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">First Name *</label>
                  <Input
                    {...form.register('first_name')}
                    placeholder="e.g. Michael"
                    className={`h-10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.first_name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                  <FormError message={form.formState.errors.first_name?.message} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Last Name</label>
                  <Input
                    {...form.register('last_name')}
                    placeholder="e.g. Scott"
                    className="h-10 rounded-xl text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Email Address</label>
                  <Input
                    type="email"
                    {...form.register('email')}
                    placeholder="michael@dundermifflin.com"
                    className={`h-10 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                  <FormError message={form.formState.errors.email?.message} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Phone Number</label>
                  <Input
                    {...form.register('phone')}
                    placeholder="+880 1700-000000"
                    className="h-10 rounded-xl text-xs font-mono border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Company Name</label>
                <Input
                  {...form.register('company_name')}
                  placeholder="e.g. Dunder Mifflin Paper Co."
                  className="h-10 rounded-xl text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Lead Source</label>
                  <select
                    {...form.register('source')}
                    className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    {leadSources.length > 0 ? (
                      leadSources.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.label} {s.label_bn ? `(${s.label_bn})` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="WALK_IN">Walk In</option>
                        <option value="PHONE">Phone</option>
                        <option value="WEBSITE">Website</option>
                        <option value="REFERRAL">Referral</option>
                        <option value="SOCIAL_MEDIA">Social Media</option>
                        <option value="OTHER">Other</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Status *</label>
                  <select
                    {...form.register('status')}
                    className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="LOST">Lost</option>
                    <option value="CONVERTED">Converted</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Notes & Context</label>
                <textarea
                  {...form.register('notes')}
                  rows={3}
                  placeholder="Key background info, customer requirements..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
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
                  <span>{editingId ? 'Save Changes' : 'Create Lead'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Leads JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Import Leads via JSON</h3>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-xl text-xs flex gap-2.5">
                <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  Paste a valid JSON array of lead objects. Each record must contain at least <code>first_name</code>.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">JSON Payload</label>
                <textarea
                  rows={8}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder={`[\n  { "first_name": "Jane", "last_name": "Doe", "email": "jane@example.com", "source": "WEBSITE" }\n]`}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importJson.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold px-5 shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Records</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
