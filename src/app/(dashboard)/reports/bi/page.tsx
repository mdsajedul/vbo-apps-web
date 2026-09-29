'use client';

import { useState, useEffect } from 'react';
import { biApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Play, Save, Database, 
  Layers, Filter, FileText, Check, Tag 
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useLanguage } from '@/i18n';

const SOURCE_COLUMNS: { [key: string]: string[] } = {
  SALES: ['id', 'receipt_number', 'customer_name', 'subtotal', 'discount_amount', 'tax_total', 'grand_total', 'payment_method', 'created_at'],
  INVENTORY: ['id', 'product_name', 'branch_name', 'quantity', 'reorder_level', 'product_cost_price'],
  CUSTOMERS: ['id', 'first_name', 'last_name', 'email', 'phone', 'company_name', 'created_at'],
  PRODUCTS: ['id', 'name', 'sku', 'type', 'selling_price', 'category_name', 'brand_name'],
  PROCUREMENT: ['id', 'po_number', 'supplier_name', 'branch_name', 'status', 'total_amount', 'created_at'],
  RETURNS: ['id', 'refund_amount', 'refund_method', 'status', 'created_at', 'branch_name', 'customer_name'],
  CRM: ['id', 'title', 'value', 'lead_first_name', 'pipeline_name', 'stage_name', 'created_at']
};

export default function ReportBuilderPage() {
  const { t } = useLanguage();
  const [dataSource, setDataSource] = useState<string>('SALES');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<string>('');
  const [aggregates, setAggregates] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingReport, setSavingReport] = useState<boolean>(false);

  // Modal Save state
  const [saveOpen, setSaveOpen] = useState<boolean>(false);
  const [reportName, setReportName] = useState<string>('');
  const [reportDesc, setReportDesc] = useState<string>('');

  // Reset selected columns when data source changes
  useEffect(() => {
    setSelectedColumns(SOURCE_COLUMNS[dataSource] || []);
    setFilters([]);
    setGroupBy('');
    setAggregates([]);
  }, [dataSource]);

  const addFilter = () => {
    setFilters([...filters, { field: SOURCE_COLUMNS[dataSource][0], operator: 'equals', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: string, val: any) => {
    const updated = [...filters];
    updated[index][key] = val;
    setFilters(updated);
  };

  const addAggregate = () => {
    setAggregates([...aggregates, { field: SOURCE_COLUMNS[dataSource].find(c => c.includes('amount') || c.includes('total') || c.includes('price') || c.includes('quantity') || c === 'value') || SOURCE_COLUMNS[dataSource][0], type: 'SUM' }]);
  };

  const removeAggregate = (index: number) => {
    setAggregates(aggregates.filter((_, i) => i !== index));
  };

  const updateAggregate = (index: number, key: string, val: any) => {
    const updated = [...aggregates];
    updated[index][key] = val;
    setAggregates(updated);
  };

  const getReportConfig = () => {
    return {
      columns: selectedColumns,
      filters: filters,
      groupBy: groupBy || undefined,
      aggregates: groupBy ? aggregates : undefined
    };
  };

  const runPreview = async () => {
    try {
      setLoading(true);
      const data = await biApi.previewReport(dataSource, getReportConfig());
      setPreviewData(data || []);
      toast.success(t('bi.builder.preview_records_loaded', { count: data?.length || 0 }));
    } catch (err) {
      console.error(err);
      toast.error(t('bi.builder.preview_error'));
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      toast.error(t('bi.builder.name_required'));
      return;
    }
    try {
      setSavingReport(true);
      await biApi.createReport({
        name: reportName,
        description: reportDesc,
        data_source: dataSource,
        config: getReportConfig()
      });
      toast.success(t('bi.builder.save_success'));
      setSaveOpen(false);
      setReportName('');
      setReportDesc('');
    } catch (err) {
      console.error(err);
      toast.error(t('bi.builder.save_error'));
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Configuration Column */}
      <div className="lg:col-span-4">
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('bi.builder.title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('bi.builder.subtitle')}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* 1. Data Source Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.builder.data_source')}
              </Label>
              <div className="relative">
                <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="SALES">{t('bi.builder.source_sales')}</option>
                  <option value="INVENTORY">{t('bi.builder.source_inventory')}</option>
                  <option value="CUSTOMERS">{t('bi.builder.source_customers')}</option>
                  <option value="PRODUCTS">{t('bi.builder.source_products')}</option>
                  <option value="PROCUREMENT">{t('bi.builder.source_procurement')}</option>
                  <option value="RETURNS">{t('bi.builder.source_returns')}</option>
                  <option value="CRM">{t('bi.builder.source_crm')}</option>
                </select>
              </div>
            </div>

            {/* 2. Column Picker */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('bi.builder.columns_to_include')}
                </Label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedColumns.length}/{SOURCE_COLUMNS[dataSource]?.length || 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/20">
                {SOURCE_COLUMNS[dataSource]?.map(col => (
                  <label key={col} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColumns([...selectedColumns, col]);
                        } else {
                          setSelectedColumns(selectedColumns.filter(c => c !== col));
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="truncate">{col.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Aggregation & Grouping */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.builder.grouping_dimension')}
              </Label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">{t('bi.builder.no_grouping')}</option>
                  {SOURCE_COLUMNS[dataSource]?.map(col => (
                    <option key={col} value={col}>{t('bi.builder.group_by_prefix', { field: col.replace(/_/g, ' ') })}</option>
                  ))}
                </select>
              </div>

              {groupBy && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                      {t('bi.builder.aggregations')}
                    </Label>
                    <PermissionGuard permission="bi:create">
                      <button 
                        type="button" 
                        onClick={addAggregate} 
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
                      >
                        {t('bi.builder.btn_add_calc')}
                      </button>
                    </PermissionGuard>
                  </div>
                  <div className="space-y-2">
                    {aggregates.map((agg, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <select
                          value={agg.type}
                          onChange={(e) => updateAggregate(idx, 'type', e.target.value)}
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="SUM">SUM</option>
                          <option value="AVG">AVG</option>
                          <option value="COUNT">COUNT</option>
                          <option value="MIN">MIN</option>
                          <option value="MAX">MAX</option>
                        </select>
                        <select
                          value={agg.field}
                          onChange={(e) => updateAggregate(idx, 'field', e.target.value)}
                          className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                        >
                          {SOURCE_COLUMNS[dataSource]?.map(col => (
                            <option key={col} value={col}>{col.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        <PermissionGuard permission="bi:delete">
                          <button 
                            type="button" 
                            onClick={() => removeAggregate(idx)} 
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </PermissionGuard>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Filters Engine */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('bi.builder.filter_conditions')}
                </Label>
                <PermissionGuard permission="bi:create">
                  <button 
                    type="button" 
                    onClick={addFilter} 
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
                  >
                    {t('bi.builder.btn_add_filter')}
                  </button>
                </PermissionGuard>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filters.map((filter, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex-1 space-y-1.5">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(idx, 'field', e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                      >
                        {SOURCE_COLUMNS[dataSource]?.map(col => (
                          <option key={col} value={col}>{col.replace(/_/g, ' ')}</option>
                        ))}
                      </select>

                      <div className="flex gap-1.5">
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(idx, 'operator', e.target.value)}
                          className="w-1/3 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                        >
                          <option value="equals">{t('bi.builder.op_equals')}</option>
                          <option value="contains">{t('bi.builder.op_contains')}</option>
                          <option value="gt">{t('bi.builder.op_gt')}</option>
                          <option value="lt">{t('bi.builder.op_lt')}</option>
                        </select>

                        <Input
                          placeholder={t('bi.builder.value_placeholder')}
                          value={filter.value}
                          onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                          className="flex-1 h-7 text-xs bg-white dark:bg-slate-900 rounded-lg border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <PermissionGuard permission="bi:delete">
                      <button 
                        type="button" 
                        onClick={() => removeFilter(idx)} 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGuard>
                  </div>
                ))}
                {filters.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-2">
                    {t('bi.builder.no_active_filters')}
                  </p>
                )}
              </div>
            </div>

            {/* 5. Main Config Actions */}
            <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button 
                onClick={runPreview} 
                disabled={loading} 
                className="flex-1 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{loading ? t('bi.builder.running') : t('bi.builder.btn_run_preview')}</span>
              </Button>
              <PermissionGuard permission="bi:update">
                <Button 
                  onClick={() => setSaveOpen(true)} 
                  variant="outline" 
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span>{t('bi.builder.btn_save')}</span>
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </Card>
      </div>

      {/* Preview Column */}
      <div className="lg:col-span-8">
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col min-h-[540px]">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('bi.builder.live_preview_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('bi.builder.live_preview_subtitle')}
              </p>
            </div>
            {previewData.length > 0 && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 font-mono">
                {previewData.length} {previewData.length === 1 ? t('bi.builder.row_singular') : t('bi.builder.rows_plural')}
              </span>
            )}
          </div>

          <CardContent className="p-0 flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                <Spinner className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
                <span className="text-xs">{t('bi.builder.executing_query')}</span>
              </div>
            ) : previewData.length > 0 ? (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      {Object.keys(previewData[0]).map(key => (
                        <th key={key} className="px-6 py-3.5 whitespace-nowrap">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {previewData.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        {Object.keys(row).map(key => {
                          const val = row[key];
                          return (
                            <td key={key} className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300 font-mono">
                              {val instanceof Object ? JSON.stringify(val) : String(val ?? '-')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-16 text-slate-400 dark:text-slate-500 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 border border-sky-500/20 shadow-2xs">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{t('bi.builder.no_preview_title')}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {t('bi.builder.no_preview_desc')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Config Modal */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('bi.builder.modal_save_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('bi.builder.modal_save_subtitle')}
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.builder.report_name_label')} <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={t('bi.builder.report_name_placeholder')}
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.builder.desc_label')}
              </Label>
              <Input
                placeholder={t('bi.builder.desc_placeholder')}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setSaveOpen(false)}
              className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
            >
              {t('bi.builder.btn_cancel')}
            </Button>
            <PermissionGuard permission="bi:update">
              <Button 
                onClick={saveReport} 
                disabled={savingReport}
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {savingReport ? t('bi.builder.saving') : t('bi.builder.btn_save_report')}
              </Button>
            </PermissionGuard>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
