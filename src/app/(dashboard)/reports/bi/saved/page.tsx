'use client';

import { useState, useEffect } from 'react';
import { biApi, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, Play, Download, Trash2, Calendar, 
  ArrowLeft, Clock, Mail, Check, FileSpreadsheet 
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/i18n';

export default function SavedReportsPage() {
  const confirm = useConfirm();
  const { t } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);

  // Schedule Modal State
  const [schOpen, setSchOpen] = useState<boolean>(false);
  const [schReportId, setSchReportId] = useState<string>('');
  const [schFreq, setSchFreq] = useState<string>('DAILY');
  const [schDow, setSchDow] = useState<number>(1);
  const [schDom, setSchDom] = useState<number>(1);
  const [schTime, setSchTime] = useState<string>('09:00');
  const [schRecipients, setSchRecipients] = useState<string>('');
  const [schFormat, setSchFormat] = useState<string>('EXCEL');
  const [scheduling, setScheduling] = useState<boolean>(false);

  async function loadReports() {
    try {
      setLoading(true);
      const data = await biApi.getReports();
      setReports(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('bi.saved.load_error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const runReport = async (report: any) => {
    try {
      setSelectedReport(report);
      setRunning(true);
      const data = await biApi.runReport(report.id);
      setResults(data || []);
      toast.success(t('bi.saved.records_loaded', { count: data?.length || 0 }));
    } catch (err) {
      console.error(err);
      toast.error(t('bi.saved.run_error'));
    } finally {
      setRunning(false);
    }
  };

  const deleteReport = async (id: string, name: string) => {
    const ok = await confirm({
      title: t('bi.saved.delete_confirm_title'),
      description: t('bi.saved.delete_confirm_desc', { name }),
      confirmText: t('bi.saved.btn_delete_confirm'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await biApi.deleteReport(id);
      toast.success(t('bi.saved.delete_success'));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
        setResults([]);
      }
      loadReports();
    } catch (err) {
      console.error(err);
      toast.error(t('bi.saved.delete_error'));
    }
  };

  const downloadExcel = async (reportId: string, name: string) => {
    try {
      setRunning(true);
      const res = await api.get(`/bi/export/${reportId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('bi.saved.excel_success'));
    } catch (err) {
      console.error(err);
      toast.error(t('bi.saved.excel_error'));
    } finally {
      setRunning(false);
    }
  };

  const openScheduleModal = (reportId: string) => {
    setSchReportId(reportId);
    setSchOpen(true);
  };

  const createSchedule = async () => {
    if (!schRecipients.trim()) {
      toast.error(t('bi.saved.recipients_required'));
      return;
    }
    const emailList = schRecipients.split(',').map(e => e.trim()).filter(e => e.length > 0);
    try {
      setScheduling(true);
      await biApi.createSchedule({
        report_id: schReportId,
        frequency: schFreq,
        day_of_week: schFreq === 'WEEKLY' ? Number(schDow) : undefined,
        day_of_month: schFreq === 'MONTHLY' ? Number(schDom) : undefined,
        time_of_day: schTime,
        recipients: emailList,
        format: schFormat
      });
      toast.success(t('bi.saved.schedule_success'));
      setSchOpen(false);
      setSchRecipients('');
    } catch (err) {
      console.error(err);
      toast.error(t('bi.saved.schedule_error'));
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-slate-900 dark:text-white" />
      </div>
    );
  }

  // Active Runner/Results view
  if (selectedReport) {
    return (
      <div className="space-y-6">
        {/* Toolbar */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setSelectedReport(null); setResults([]); }}
                  className="rounded-xl text-xs font-semibold px-3 h-9 border-slate-200 dark:border-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> {t('bi.saved.btn_back')}
                </Button>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                    {selectedReport.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedReport.description || t('bi.saved.custom_report_default_desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => runReport(selectedReport)} 
                  disabled={running} 
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 shadow-xs flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{running ? t('bi.builder.running') : t('bi.saved.btn_rerun')}</span>
                </Button>
                <Button 
                  onClick={() => downloadExcel(selectedReport.id, selectedReport.name)} 
                  disabled={running} 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl text-xs font-semibold h-9 px-3.5 border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('bi.saved.btn_excel')}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden min-h-[400px] flex flex-col">
          {running ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              <Spinner className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
              <span className="text-xs">{t('bi.builder.executing_query')}</span>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('bi.saved.record_count')}: <span className="font-mono font-bold text-slate-900 dark:text-white">{results.length}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {t('bi.saved.source_label')}: {selectedReport.data_source}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      {Object.keys(results[0]).map(key => (
                        <th key={key} className="px-6 py-3.5 whitespace-nowrap">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {results.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        {Object.keys(row).map(key => (
                          <td key={key} className="px-6 py-3.5 whitespace-nowrap font-mono text-xs text-slate-700 dark:text-slate-300">
                            {String(row[key] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-16 text-slate-400 dark:text-slate-500 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 border border-sky-500/20 shadow-2xs">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{t('bi.saved.no_results_title')}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {t('bi.saved.no_results_desc')}
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('bi.saved.title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('bi.saved.subtitle')}
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 font-mono">
            {reports.length} {reports.length === 1 ? t('bi.saved.report_singular') : t('bi.saved.reports_plural')}
          </span>
        </div>

        <CardContent className="p-0">
          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">{t('bi.saved.col_report_name')}</th>
                    <th className="px-6 py-4">{t('bi.saved.col_source')}</th>
                    <th className="px-6 py-4">{t('bi.saved.col_created')}</th>
                    <th className="px-6 py-4 text-right">{t('bi.saved.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {reports.map((report) => {
                    const getSourceBadge = (source: string) => {
                      switch (source?.toUpperCase()) {
                        case 'SALES':
                          return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                        case 'INVENTORY':
                          return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                        case 'CUSTOMERS':
                        case 'CRM':
                          return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                        case 'PROCUREMENT':
                          return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
                        default:
                          return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
                      }
                    };

                    return (
                      <tr key={report.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{report.name}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                            {report.description || t('bi.saved.custom_report_default_desc')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${getSourceBadge(report.data_source)}`}>
                            {report.data_source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-1.5">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => runReport(report)} 
                            className="rounded-xl h-8 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:text-indigo-600"
                          >
                            <Play className="w-3 h-3 mr-1 text-indigo-600" /> {t('bi.saved.btn_run')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openScheduleModal(report.id)} 
                            className="rounded-xl h-8 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:text-sky-600"
                          >
                            <Calendar className="w-3 h-3 mr-1 text-sky-600" /> {t('bi.saved.btn_schedule')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => downloadExcel(report.id, report.name)} 
                            className="rounded-xl h-8 text-xs font-semibold border-slate-200 dark:border-slate-700"
                          >
                            <Download className="w-3 h-3 mr-1" /> {t('bi.saved.btn_excel')}
                          </Button>
                          <PermissionGuard permission="bi:delete">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deleteReport(report.id, report.name)} 
                              className="rounded-xl h-8 text-xs text-rose-500 hover:text-rose-700 border-slate-200 dark:border-slate-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </PermissionGuard>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 border border-sky-500/20 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{t('bi.saved.no_saved_title')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('bi.saved.no_saved_desc')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={schOpen} onOpenChange={setSchOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('bi.saved.modal_schedule_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('bi.saved.modal_schedule_subtitle')}
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('bi.saved.freq_label')}
                </Label>
                <select
                  value={schFreq}
                  onChange={(e) => setSchFreq(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="DAILY">{t('bi.saved.freq_daily')}</option>
                  <option value="WEEKLY">{t('bi.saved.freq_weekly')}</option>
                  <option value="MONTHLY">{t('bi.saved.freq_monthly')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('bi.saved.format_label')}
                </Label>
                <select
                  value={schFormat}
                  onChange={(e) => setSchFormat(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="EXCEL">{t('bi.saved.format_excel')}</option>
                  <option value="CSV">{t('bi.saved.format_csv')}</option>
                </select>
              </div>
            </div>

            {schFreq === 'WEEKLY' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('bi.saved.dow_label')}
                </Label>
                <select
                  value={schDow}
                  onChange={(e) => setSchDow(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value={0}>{t('bi.saved.sun')}</option>
                  <option value={1}>{t('bi.saved.mon')}</option>
                  <option value={2}>{t('bi.saved.tue')}</option>
                  <option value={3}>{t('bi.saved.wed')}</option>
                  <option value={4}>{t('bi.saved.thu')}</option>
                  <option value={5}>{t('bi.saved.fri')}</option>
                  <option value={6}>{t('bi.saved.sat')}</option>
                </select>
              </div>
            )}

            {schFreq === 'MONTHLY' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('bi.saved.dom_label')}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={schDom}
                  onChange={(e) => setSchDom(Number(e.target.value))}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.saved.time_label')}
              </Label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="09:00"
                  value={schTime}
                  onChange={(e) => setSchTime(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.saved.recipients_label')} <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={t('bi.saved.recipients_placeholder')}
                  value={schRecipients}
                  onChange={(e) => setSchRecipients(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setSchOpen(false)}
              className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
            >
              {t('bi.saved.btn_cancel')}
            </Button>
            <PermissionGuard permission="bi:create">
              <Button 
                onClick={createSchedule} 
                disabled={scheduling}
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {scheduling ? t('bi.saved.scheduling') : t('bi.saved.btn_create_schedule')}
              </Button>
            </PermissionGuard>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
