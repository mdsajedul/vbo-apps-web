'use client';

import { useState, useEffect } from 'react';
import { crmApi } from '@/lib/api';
import { 
  Plus, Trash2, GitPullRequest, ArrowRightCircle, 
  Star, ArrowLeft, Target, Check, X, Layers, Users 
} from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';

type StageInput = {
  name: string;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
  color?: string;
};

export default function CrmPipelinesPage() {
  const confirm = useConfirm();
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [stages, setStages] = useState<StageInput[]>([
    { name: 'Lead Qualified', probability: 10, is_won: false, is_lost: false },
    { name: 'Contacted', probability: 30, is_won: false, is_lost: false },
    { name: 'Proposal Sent', probability: 70, is_won: false, is_lost: false },
    { name: 'Negotiation', probability: 90, is_won: false, is_lost: false },
    { name: 'Closed Won', probability: 100, is_won: true, is_lost: false },
    { name: 'Closed Lost', probability: 0, is_won: false, is_lost: true },
  ]);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const data = await crmApi.getPipelines();
      setPipelines(data || []);
    } catch (err) {
      console.error('Failed to fetch pipelines', err);
      toast.error('Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const handleAddStage = () => {
    setStages(prev => [
      ...prev,
      { name: '', probability: 50, is_won: false, is_lost: false }
    ]);
  };

  const handleRemoveStage = (idx: number) => {
    setStages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleStageChange = (idx: number, field: keyof StageInput, value: any) => {
    setStages(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      
      const updated = { ...s, [field]: value };
      
      if (field === 'is_won' && value) {
        updated.is_lost = false;
        updated.probability = 100;
      }
      if (field === 'is_lost' && value) {
        updated.is_won = false;
        updated.probability = 0;
      }
      
      return updated;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Pipeline name is required');
      return;
    }
    if (stages.length === 0) {
      toast.error('At least one stage is required');
      return;
    }
    if (stages.some(s => !s.name.trim())) {
      toast.error('All stage names must be filled out');
      return;
    }

    try {
      const payload = {
        name,
        is_default: isDefault,
        stages: stages.map((s, index) => ({
          ...s,
          order: index
        }))
      };

      await crmApi.createPipeline(payload);
      toast.success('Pipeline created successfully');
      setIsModalOpen(false);
      setName('');
      setIsDefault(false);
      setStages([
        { name: 'Lead Qualified', probability: 10, is_won: false, is_lost: false },
        { name: 'Contacted', probability: 30, is_won: false, is_lost: false },
        { name: 'Proposal Sent', probability: 70, is_won: false, is_lost: false },
        { name: 'Negotiation', probability: 90, is_won: false, is_lost: false },
        { name: 'Closed Won', probability: 100, is_won: true, is_lost: false },
        { name: 'Closed Lost', probability: 0, is_won: false, is_lost: true },
      ]);
      fetchPipelines();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create pipeline');
    }
  };

  const handleDeletePipeline = async (id: string, pipelineName?: string) => {
    const ok = await confirm({
      title: 'Delete Sales Pipeline',
      description: `Are you sure you want to delete ${pipelineName ? `"${pipelineName}"` : 'this pipeline'}? All deals and opportunities associated with it will be affected.`,
      confirmText: 'Delete Pipeline',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await crmApi.deletePipeline(id);
      toast.success('Pipeline deleted successfully');
      fetchPipelines();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete pipeline');
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
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Sales Pipelines & Stages
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure multi-stage deal funnels with custom win probabilities and closing criteria.
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
              <span>Create Pipeline</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-500">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span>Loading sales pipelines...</span>
          </div>
        </div>
      ) : pipelines.length === 0 ? (
        <div className="p-16 text-center text-slate-500">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">No pipelines defined</p>
            <p className="text-xs text-slate-400">Create your first sales process to start managing deal stages.</p>
            <Button 
              size="sm" 
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Create first pipeline
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pipelines.map((pipeline) => (
            <Card
              key={pipeline.id}
              className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70 p-5 group"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    {pipeline.name}
                    {pipeline.is_default && (
                      <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        Default
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Process consists of <span className="font-bold text-slate-700 dark:text-slate-300">{pipeline.stages?.length || 0}</span> funnel stages
                  </p>
                </div>
                {!pipeline.is_default && (
                  <PermissionGuard permission="crm:delete">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePipeline(pipeline.id)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </PermissionGuard>
                )}
              </div>

              {/* Stages List */}
              <div className="space-y-2.5">
                {pipeline.stages?.map((stage: any) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-3 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <ArrowRightCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {stage.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">
                        Prob: <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{stage.probability}%</span>
                      </span>
                      {stage.is_won && (
                        <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Win Goal
                        </span>
                      )}
                      {stage.is_lost && (
                        <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Loss Exit
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Pipeline Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create Sales Pipeline Process
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Pipeline Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Enterprise B2B Sales"
                    className="h-10 rounded-xl text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2.5 sm:mt-5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Switch
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                    id="pipeline-default"
                  />
                  <label htmlFor="pipeline-default" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                    Set as Default Pipeline
                  </label>
                </div>
              </div>

              {/* Stages Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Pipeline Stages & Win Probability</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddStage}
                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold h-7 px-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stage</span>
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
                  {stages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex-1">
                        <Input
                          value={stage.name}
                          onChange={(e) => handleStageChange(idx, 'name', e.target.value)}
                          placeholder={`Stage #${idx + 1} Name`}
                          className="h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs rounded-lg"
                        />
                      </div>

                      <div className="w-20">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={stage.probability}
                          onChange={(e) => handleStageChange(idx, 'probability', parseInt(e.target.value) || 0)}
                          placeholder="%"
                          className="h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs text-center font-mono rounded-lg"
                          disabled={stage.is_won || stage.is_lost}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs font-semibold px-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stage.is_won}
                            onChange={(e) => handleStageChange(idx, 'is_won', e.target.checked)}
                            className="rounded text-emerald-600 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-emerald-600">Won</span>
                        </label>

                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stage.is_lost}
                            onChange={(e) => handleStageChange(idx, 'is_lost', e.target.checked)}
                            className="rounded text-rose-600 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-rose-600">Lost</span>
                        </label>
                      </div>

                      {stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
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
                  <span>Create Pipeline</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
