'use client';

import { useState, useEffect } from 'react';
import { uploadApi, branchesApi } from '@/lib/api';
import { 
  UploadCloud, Download, CheckCircle2, AlertTriangle, 
  ArrowRight, Save, Package, ArrowLeft, Check, FileSpreadsheet, Building2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import * as xlsx from 'xlsx';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useTranslation } from '@/i18n';

export default function ImportProductsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  const [preview, setPreview] = useState<{ validRows: any[], invalidRows: any[] } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const allPreviewRows = preview ? [...preview.invalidRows, ...preview.validRows] : [];
  const totalPages = Math.ceil(allPreviewRows.length / itemsPerPage) || 1;
  const paginatedPreviewRows = allPreviewRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    branchesApi.getAll().then(res => {
      const data = res.data || res || [];
      setBranches(data);
      if (data.length > 0) {
        setSelectedBranch(data[0].id);
      }
    }).catch(console.error);
  }, []);

  const downloadTemplate = () => {
    const template = [
      ['Type', 'SKU', 'Parent SKU', 'Name', 'Barcode', 'Category', 'Brand', 'Cost Price', 'Selling Price', 'Tax Class', 'Initial Stock', 'Reorder Level'],
      ['SIMPLE', 'APP-IPH-14', '', 'iPhone 14', '1234567890123', 'Electronics', 'Apple', '80000', '90000', 'STANDARD', '50', '5'],
      ['VARIABLE', 'TSHIRT-RED-L', 'TSHIRT-PARENT', 'Red Large T-Shirt', '', 'Apparel', 'Nike', '400', '600', 'STANDARD', '100', '10']
    ];
    
    const ws = xlsx.utils.aoa_to_sheet(template);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Products");
    xlsx.writeFile(wb, "BOS_Product_Import_Template.xlsx");
    toast.success(t('catalog.import_page.template_success'));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-validate
      setLoading(true);
      try {
        const result = await uploadApi.validateProducts(selectedFile);
        setPreview(result);
        setCurrentPage(1);
        toast.success(t('catalog.import_page.file_success'));
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('catalog.import_page.file_error'));
        setFile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCommit = async () => {
    if (!preview || preview.validRows.length === 0) return;
    if (!selectedBranch) return toast.error(t('catalog.import_page.select_branch_error'));

    setLoading(true);
    try {
      const result = await uploadApi.commitProducts(preview.validRows, selectedBranch);
      toast.success(t('catalog.import_page.commit_success', { count: result.count }));
      router.push('/catalog/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('catalog.import_page.file_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/catalog/products">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('catalog.import_page.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('catalog.import_page.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            onClick={downloadTemplate}
            variant="outline"
            className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-teal-500/30"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('catalog.import_page.download_template')}</span>
          </Button>
        </div>
      </div>

      {!preview ? (
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('catalog.import_page.upload_title')}</h3>
          </div>

          <CardContent className="p-8">
            <div className="max-w-md mx-auto space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('catalog.import_page.initial_stock_branch')}</span>
                </label>
                <select 
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center hover:border-teal-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all relative cursor-pointer">
                <input 
                  type="file" 
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3 border border-teal-500/20 shadow-2xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{t('catalog.import_page.drop_or_browse')}</h3>
                  <p className="text-xs text-slate-400">{t('catalog.import_page.upload_subtitle')}</p>
                </div>
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 animate-pulse">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  <span>{t('catalog.import_page.analyzing')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('catalog.import_page.valid_rows', { count: preview.validRows.length })}
              </span>
              {preview.invalidRows.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t('catalog.import_page.invalid_rows', { count: preview.invalidRows.length })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Button 
                variant="outline"
                onClick={() => { setPreview(null); setFile(null); }}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('catalog.categories_page.cancel')}
              </Button>
              <PermissionGuard permission="catalog:create">
                <Button 
                  onClick={handleCommit}
                  disabled={loading || preview.validRows.length === 0}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <span>{loading ? t('catalog.import_page.importing_btn') : t('catalog.import_page.commit_btn', { count: preview.validRows.length })}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </Button>
              </PermissionGuard>
            </div>
          </div>

          {/* Table */}
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 sticky top-0">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">{t('catalog.import_page.col_status')}</th>
                    <th className="px-6 py-3.5 font-semibold">{t('catalog.import_page.col_sku')}</th>
                    <th className="px-6 py-3.5 font-semibold">{t('catalog.import_page.col_name')}</th>
                    <th className="px-6 py-3.5 font-semibold">{t('catalog.import_page.col_category')}</th>
                    <th className="px-6 py-3.5 font-semibold">{t('catalog.import_page.col_price')}</th>
                    <th className="px-6 py-3.5 font-semibold">{t('catalog.import_page.col_stock')}</th>
                    <th className="px-6 py-3.5 font-semibold">{t('catalog.import_page.col_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedPreviewRows.map((row, i) => {
                    const isInvalid = row.errors && row.errors.length > 0;
                    return isInvalid ? (
                      <tr key={`invalid-${i}`} className="bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 transition-colors">
                        <td className="px-6 py-3.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{row.sku || '-'}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white text-xs">{row.name || '-'}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400">{row.category || '-'}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400">৳{row.selling_price || '-'}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400">{row.initial_stock || '0'}</td>
                        <td className="px-6 py-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400">{row.errors.join(', ')}</td>
                      </tr>
                    ) : (
                      <tr key={`valid-${i}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">{row.sku}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white text-xs">{row.name}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          {row.category || <span className="text-slate-400 italic">Auto-generate</span>}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">৳{row.selling_price}</td>
                        <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white text-xs">{row.initial_stock}</td>
                        <td className="px-6 py-3.5 text-xs text-emerald-600 font-medium">{t('catalog.import_page.status_ready')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {allPreviewRows.length === 0 && (
                <div className="p-12 text-center text-slate-500 text-xs">No data found in the file.</div>
              )}
            </div>
            
            {allPreviewRows.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  totalItems={allPreviewRows.length}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
