'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { crmApi } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, User, Phone, Mail, Building2, 
  Briefcase, Plus, MessageSquare, PhoneCall, 
  Calendar, CheckCircle2, Clock, Sparkles 
} from 'lucide-react';
import Link from 'next/link';

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLeadAndActivities();
    }
  }, [id]);

  const fetchLeadAndActivities = async () => {
    setLoading(true);
    try {
      const [leadData, activitiesData] = await Promise.all([
        crmApi.getLead(id),
        crmApi.getActivities({ lead_id: id })
      ]);
      setLead(leadData);
      setActivities(activitiesData || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    try {
      await crmApi.convertLead(id);
      toast.success('Lead converted to customer successfully');
      router.push('/crm/opportunities');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to convert lead');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <div className="inline-flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          <span>Loading prospect details...</span>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-16 text-center text-rose-500 font-bold text-sm">
        Lead record not found
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/crm/leads">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20 shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {lead.first_name} {lead.last_name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acquired via {lead.source || 'Direct Outreach'} on {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {lead.status !== 'CONVERTED' && (
            <Button 
              onClick={handleConvert} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Convert to Customer</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
            <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Contact & Company Profile
              </h3>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{lead.email || 'No email provided'}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{lead.phone || 'No phone provided'}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{lead.company_name || 'No company'}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{lead.job_title || 'Position not specified'}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Pipeline Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                    {lead.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Source Channel</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{lead.source}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Lead Score</span>
                  <div className="flex items-center gap-1 font-bold text-emerald-600 font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lead.score || 0} / 100</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Estimated Value</span>
                  <span className="font-bold text-emerald-600 font-mono">৳{((lead.estimated_value || 0) / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activities Timeline Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity History & Touchpoints</h3>
              <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs">
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Log Activity</span>
              </Button>
            </div>
            
            <CardContent className="p-6">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No interactions or calls recorded for this lead yet.
                </div>
              ) : (
                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-6">
                      <div className="absolute -left-[14px] top-1 w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
                        {activity.type === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-blue-500" />}
                        {activity.type === 'CALL' && <PhoneCall className="w-3.5 h-3.5 text-amber-500" />}
                        {activity.type === 'MEETING' && <Calendar className="w-3.5 h-3.5 text-emerald-500" />}
                        {activity.type === 'NOTE' && <MessageSquare className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <div className="bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">{activity.subject}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">{activity.type}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(activity.activity_date).toLocaleString()}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            activity.status === 'COMPLETED' 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50' 
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                        {activity.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">
                            {activity.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
