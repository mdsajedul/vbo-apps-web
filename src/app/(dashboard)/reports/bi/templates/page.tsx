'use client';

import { useState, useEffect } from 'react';
import { biApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { 
  Calendar, Play, Download, ArrowLeft, 
  LayoutGrid, FileSpreadsheet, Layers 
} from 'lucide-react';
import { useLanguage } from '@/i18n';

export default function TemplatesPage() {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  
  // Date filter states
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await biApi.getTemplates();
        setTemplates(data || []);
      } catch (err) {
        console.error(err);
        toast.error(t('bi.templates.load_error'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const runTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setRunning(true);
      const data = await biApi.runTemplate(selectedTemplate.id, { startDate, endDate });
      setResults(data || []);
      toast.success(t('bi.templates.records_fetched', { count: data?.length || 0 }));
    } catch (err) {
      console.error(err);
      toast.error(t('bi.templates.run_error'));
    } finally {
      setRunning(false);
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = Object.keys(results[0]);
    const csvRows = [
      headers.join(','),
      ...results.map(row => headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '');
      }).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedTemplate.id}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('bi.templates.csv_success'));
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-slate-900 dark:text-white" />
      </div>
    );
  }

  // Parameter and runner view
  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        {/* Header toolbar card */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setSelectedTemplate(null); setResults([]); }}
                  className="rounded-xl text-xs font-semibold px-3 h-9 border-slate-200 dark:border-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> {t('bi.templates.btn_back')}
                </Button>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500 uppercase px-2">{t('bi.templates.from_label')}</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 py-0.5 text-xs w-32 border-0 bg-transparent"
                  />
                  <span className="text-[11px] font-bold text-slate-500 uppercase px-1">{t('bi.templates.to_label')}</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 py-0.5 text-xs w-32 border-0 bg-transparent"
                  />
                </div>

                <Button 
                  onClick={runTemplate} 
                  disabled={running} 
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 shadow-xs flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{running ? t('bi.builder.running') : t('bi.templates.btn_run_template')}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Container */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden min-h-[400px] flex flex-col">
          {running ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              <Spinner className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
              <span className="text-xs">{t('bi.templates.executing')}</span>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('bi.templates.total_rows')}: <span className="font-mono font-bold text-slate-900 dark:text-white">{results.length}</span>
                </span>
                <Button 
                  onClick={exportCSV} 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl text-xs font-semibold h-8 border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('bi.templates.btn_export_csv')}</span>
                </Button>
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
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{t('bi.templates.no_results_title')}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {t('bi.templates.no_results_desc')}
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const getSourceIconBadge = (source: string) => {
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

  // Card list view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {templates.map(tpl => {
        const badgeClasses = getSourceIconBadge(tpl.source);

        return (
          <Card
            key={tpl.id}
            onClick={() => setSelectedTemplate(tpl)}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs cursor-pointer hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between group overflow-hidden"
          >
            <CardContent className="p-5 space-y-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform ${badgeClasses}`}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
            </CardContent>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                {tpl.source}
              </span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                {t('bi.templates.btn_run_arrow')}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
