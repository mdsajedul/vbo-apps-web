'use client';

import { useState, useEffect } from 'react';
import { crmApi } from '@/lib/api';
import { 
  Plus, ArrowRightLeft, DollarSign, Calendar, 
  Sparkles, AlertCircle, Target, ArrowLeft, 
  CheckCircle2, Trash2, Edit2, Check, X, GitPullRequest 
} from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const opportunitySchema = z.object({
  title: z.string().min(1, 'Deal Title is required'),
  value: z.coerce.number().min(0, 'Value must be positive'),
  lead_id: z.string().min(1, 'Lead is required'),
  pipeline_id: z.string().min(1, 'Pipeline is required'),
  stage_id: z.string().min(1, 'Stage is required'),
  expected_close_date: z.string().optional(),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

export default function CrmOpportunitiesPage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [board, setBoard] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirm Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema) as any,
    defaultValues: {
      title: '',
      value: 0,
      lead_id: '',
      pipeline_id: '',
      stage_id: '',
      expected_close_date: ''
    }
  });

  const watchPipelineId = form.watch('pipeline_id');

  // Load pipelines and leads
  useEffect(() => {
    async function init() {
      try {
        const [pipelinesData, leadsData] = await Promise.all([
          crmApi.getPipelines(),
          crmApi.getLeads({ limit: 100 })
        ]);
        setPipelines(pipelinesData || []);
        setLeads(leadsData?.data || []);

        if (pipelinesData && pipelinesData.length > 0) {
          const defaultPipeline = pipelinesData.find((p: any) => p.is_default) || pipelinesData[0];
          setSelectedPipelineId(defaultPipeline.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load initial opportunities data', err);
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch Board when pipeline changes
  const fetchBoard = async () => {
    if (!selectedPipelineId) return;
    try {
      setLoading(true);
      const data = await crmApi.getKanbanBoard(selectedPipelineId);
      setBoard(data);
    } catch (err) {
      console.error('Failed to load Kanban board', err);
      toast.error('Failed to load opportunities board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [selectedPipelineId]);

  // Adjust stages when pipeline is selected in form
  useEffect(() => {
    if (watchPipelineId) {
      const selected = pipelines.find(p => p.id === watchPipelineId);
      if (selected && selected.stages && selected.stages.length > 0) {
        form.setValue('stage_id', selected.stages[0].id);
      } else {
        form.setValue('stage_id', '');
      }
    }
  }, [watchPipelineId, pipelines]);

  const onSubmit = async (data: OpportunityFormValues) => {
    try {
      const payload = {
        title: data.title.trim(),
        value: Math.round(data.value * 100),
        lead_id: data.lead_id || undefined,
        pipeline_id: data.pipeline_id,
        stage_id: data.stage_id,
        expected_close_date: data.expected_close_date && data.expected_close_date.trim() !== '' ? new Date(data.expected_close_date).toISOString() : undefined,
      };

      if (editingId) {
        await crmApi.updateOpportunity(editingId, payload);
        toast.success('Opportunity updated successfully');
      } else {
        await crmApi.createOpportunity(payload);
        toast.success('Opportunity created successfully');
      }
      setIsModalOpen(false);
      fetchBoard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save opportunity');
    }
  };

  const handleStageChange = async (opportunityId: string, newStageId: string) => {
    try {
      await crmApi.updateOpportunity(opportunityId, { stage_id: newStageId });
      toast.success('Deal stage updated');
      fetchBoard();
    } catch (err: any) {
      toast.error('Failed to update stage');
    }
  };

  const handleStatusChange = async (opportunityId: string, status: string) => {
    try {
      await crmApi.updateOpportunity(opportunityId, { status });
      toast.success(`Opportunity marked as ${status}`);
      fetchBoard();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    try {
      await crmApi.deleteOpportunity(deletingId);
      toast.success('Opportunity deleted successfully');
      fetchBoard();
    } catch (err: any) {
      toast.error('Failed to delete opportunity');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    form.reset({
      title: '',
      value: 0,
      lead_id: leads[0]?.id || '',
      pipeline_id: selectedPipelineId,
      stage_id: board?.stages[0]?.id || '',
      expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (opp: any) => {
    setEditingId(opp.id);
    form.reset({
      title: opp.title,
      value: opp.value / 100,
      lead_id: opp.lead_id || '',
      pipeline_id: selectedPipelineId,
      stage_id: opp.stage_id,
      expected_close_date: opp.expected_close_date ? new Date(opp.expected_close_date).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/crm">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Deals & Opportunities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kanban deal pipeline with weighted win probabilities and revenue stages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <OrganizationSelector value={orgId} onChange={setOrgId} />
          <Link href="/crm/pipelines">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-amber-500" />
              <span>Pipelines</span>
            </Button>
          </Link>
          <PermissionGuard permission="crm:create">
            <Button
              onClick={openAddModal}
              disabled={!selectedPipelineId || leads.length === 0}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Deal</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Pipeline Filter Bar */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <GitPullRequest className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Active Pipeline:</span>
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          {leads.length === 0 && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Create a lead in Leads directory before opening deals.
            </span>
          )}
        </div>
      </Card>

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="p-20 text-center text-slate-500">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span>Loading pipeline Kanban stages...</span>
          </div>
        </div>
      ) : !board ? (
        <div className="p-16 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          No pipeline found. Create a pipeline in the Pipelines tab first.
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start select-none">
          {board.stages.map((stage: any) => {
            const totalStageValue = stage.opportunities.reduce((acc: number, o: any) => acc + o.value, 0);
            return (
              <div
                key={stage.id}
                className="w-80 shrink-0 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xs"
              >
                {/* Stage Header */}
                <div className="flex flex-col gap-1 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {stage.name}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {stage.opportunities.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-0.5">
                    <span>Win Prob: <span className="font-bold text-slate-600 dark:text-slate-300">{stage.probability}%</span></span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ৳ {(totalStageValue / 100).toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>

                {/* Opportunity Cards */}
                <div className="flex flex-col gap-2.5 min-h-[300px]">
                  {stage.opportunities.map((opp: any) => (
                    <div
                      key={opp.id}
                      className={`bg-white dark:bg-slate-900 border ${
                        opp.status === 'WON' ? 'border-emerald-500/40 shadow-emerald-500/5' :
                        opp.status === 'LOST' ? 'border-rose-500/40 shadow-rose-500/5' :
                        'border-slate-200/80 dark:border-slate-800'
                      } hover:border-indigo-400 p-3.5 rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 group relative space-y-2`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 transition-colors">
                          {opp.title}
                        </h4>
                        {opp.status !== 'OPEN' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                            opp.status === 'WON' 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50' 
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/50'
                          }`}>
                            {opp.status}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Lead: <span className="font-semibold text-slate-700 dark:text-slate-300">{opp.lead ? `${opp.lead.first_name} ${opp.lead.last_name || ''}` : 'Unknown'}</span>
                      </p>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                        <div className="flex items-center gap-1 font-bold font-mono text-emerald-600 text-xs">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>৳ {(opp.value / 100).toLocaleString('en-BD')}</span>
                        </div>
                        {opp.expected_close_date && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(opp.expected_close_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Row */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                        <select
                          value={opp.stage_id}
                          onChange={(e) => handleStageChange(opp.id, e.target.value)}
                          className="text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                        >
                          {board.stages.map((st: any) => (
                            <option key={st.id} value={st.id}>
                              Move to: {st.name}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-1 items-center">
                          <PermissionGuard permission="crm:update">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEditModal(opp)}
                              className="h-7 w-7 text-slate-400 hover:text-indigo-600 rounded-lg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="crm:delete">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => confirmDelete(opp.id)}
                              className="h-7 w-7 text-slate-400 hover:text-rose-600 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </PermissionGuard>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stage.opportunities.length === 0 && (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-[11px] text-slate-400">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Opportunity' : 'Create New Deal'}
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Deal Title *</label>
                <Input
                  {...form.register('title')}
                  placeholder="e.g. Enterprise CRM License (10 Seats)"
                  className={`h-10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.title ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                <FormError message={form.formState.errors.title?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Deal Value (৳) *</label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('value')}
                  placeholder="50000"
                  className={`h-10 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.value ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                <FormError message={form.formState.errors.value?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Associated Lead *</label>
                <select
                  {...form.register('lead_id')}
                  className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.lead_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <option value="">Select Lead</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.first_name} {l.last_name || ''} ({l.company_name || 'No Company'})</option>
                  ))}
                </select>
                <FormError message={form.formState.errors.lead_id?.message} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Pipeline Stage *</label>
                  <select
                    {...form.register('stage_id')}
                    className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    {board?.stages?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.probability}%)</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Expected Close</label>
                  <Input
                    type="date"
                    {...form.register('expected_close_date')}
                    className="h-10 rounded-xl text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  <span>{editingId ? 'Save Deal' : 'Create Deal'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Delete Opportunity"
        description="Are you sure you want to delete this deal? This action cannot be undone."
        onConfirm={executeDelete}
      />
    </div>
  );
}
