'use client';

import { useState, useEffect } from 'react';
import { biApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Calendar, Trash2, Clock, Mail, CheckCircle2, PauseCircle } from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/i18n';

export default function SchedulesPage() {
  const confirm = useConfirm();
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadSchedules() {
    try {
      setLoading(true);
      const data = await biApi.getSchedules();
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('bi.schedules.load_error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  const toggleSchedule = async (id: string, currentStatus: boolean) => {
    try {
      await biApi.updateSchedule(id, { is_active: !currentStatus });
      toast.success(currentStatus ? t('bi.schedules.pause_success') : t('bi.schedules.activate_success'));
      loadSchedules();
    } catch (err) {
      console.error(err);
      toast.error(t('bi.schedules.toggle_error'));
    }
  };

  const deleteSchedule = async (id: string) => {
    const ok = await confirm({
      title: t('bi.schedules.delete_confirm_title'),
      description: t('bi.schedules.delete_confirm_desc'),
      confirmText: t('bi.schedules.btn_delete_confirm'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await biApi.deleteSchedule(id);
      toast.success(t('bi.schedules.delete_success'));
      loadSchedules();
    } catch (err) {
      console.error(err);
      toast.error(t('bi.schedules.delete_error'));
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('bi.schedules.title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('bi.schedules.subtitle')}
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 font-mono">
          {schedules.length} {schedules.length === 1 ? t('bi.schedules.schedule_singular') : t('bi.schedules.schedules_plural')}
        </span>
      </div>

      <CardContent className="p-0">
        {schedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">{t('bi.schedules.col_report_format')}</th>
                  <th className="px-6 py-4">{t('bi.schedules.col_freq_time')}</th>
                  <th className="px-6 py-4">{t('bi.schedules.col_recipients')}</th>
                  <th className="px-6 py-4">{t('bi.schedules.col_next_run')}</th>
                  <th className="px-6 py-4 text-center">{t('bi.schedules.col_status')}</th>
                  <th className="px-6 py-4 text-right">{t('bi.schedules.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Name & Format */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sch.report?.name ?? t('bi.schedules.custom_report')}
                      </div>
                      <span className="inline-block font-mono text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded mt-1 border border-sky-500/20">
                        {sch.format}
                      </span>
                    </td>

                    {/* Frequency */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{sch.frequency}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{sch.time_of_day} UTC</span>
                        {sch.frequency === 'WEEKLY' && <span>• {t('bi.schedules.day_prefix', { day: sch.day_of_week })}</span>}
                        {sch.frequency === 'MONTHLY' && <span>• {t('bi.schedules.day_prefix', { day: sch.day_of_month })}</span>}
                      </div>
                    </td>

                    {/* Recipients */}
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate font-mono">
                        {Array.isArray(sch.recipients) ? sch.recipients.join(', ') : String(sch.recipients)}
                      </div>
                    </td>

                    {/* Next run */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-600 dark:text-slate-400">
                      {new Date(sch.next_run_at).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleSchedule(sch.id, sch.is_active)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                          sch.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sch.is_active ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {sch.is_active ? t('bi.schedules.status_active') : t('bi.schedules.status_paused')}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <PermissionGuard permission="bi:delete">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSchedule(sch.id)}
                          className="rounded-xl h-8 text-xs text-rose-500 hover:text-rose-700 border-slate-200 dark:border-slate-700"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> {t('bi.schedules.btn_delete')}
                        </Button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 border border-sky-500/20 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{t('bi.schedules.no_schedules_title')}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {t('bi.schedules.no_schedules_desc')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
