'use client';

import { useEffect, useState } from 'react';
import { branchesApi } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BranchForm from './components/branch-form';
import { Pagination } from '@/components/ui/pagination';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useLanguage } from '@/i18n';
import { 
  Building2, Store, Plus, Edit2, Globe, 
  Utensils, ShoppingBag, Layers, MapPin 
} from 'lucide-react';

export default function BranchesSettingsPage() {
  const { t } = useLanguage();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const result = await branchesApi.getAll({ page: currentPage, limit: itemsPerPage });
      setBranches(result.data || []);
      if (result.meta) {
        setTotalItems(result.meta.total);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [currentPage, itemsPerPage]);

  const handleCreate = () => {
    setEditingBranch(null);
    setIsFormOpen(true);
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    loadBranches();
    useBranchStore.getState().fetchAccessibleBranches().catch(() => null);
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('settings.branches.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.branches.subtitle')}
            </p>
          </div>
        </div>

        <PermissionGuard permission="branches:create">
          <Button 
            onClick={handleCreate} 
            className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 self-start sm:self-auto px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('settings.branches.add_branch')}</span>
          </Button>
        </PermissionGuard>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.branches.registered_locations')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.branches.locations_subtitle')}
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
            {branches.length} {branches.length === 1 ? t('settings.branches.location_singular') : t('settings.branches.locations_plural')}
          </span>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">{t('settings.branches.col_name')}</th>
                  <th className="px-6 py-4">{t('settings.branches.col_code')}</th>
                  <th className="px-6 py-4">{t('settings.branches.col_vertical')}</th>
                  <th className="px-6 py-4 text-center">{t('settings.branches.col_status')}</th>
                  <th className="px-6 py-4 text-right">{t('settings.branches.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 dark:border-white"></div>
                        <span>{t('settings.branches.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : branches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      {t('settings.branches.no_branches')}
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => {
                    const industry = (branch.industry_type || 'RESTAURANT').toUpperCase();

                    return (
                      <tr key={branch.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        {/* Name & Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-200/60 dark:border-slate-700 flex-shrink-0">
                              <Store className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {branch.name}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  <span>{branch.timezone || 'Asia/Dhaka'}</span>
                                </div>
                                {branch.address && (
                                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span>
                                      {[
                                        branch.address.upazila?.name,
                                        branch.address.district?.name,
                                        branch.address.division?.name,
                                      ].filter(Boolean).join(', ') || branch.address.street_address || branch.address.country?.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Branch Code */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            {branch.code}
                          </span>
                        </td>

                        {/* Industry Vertical */}
                        <td className="px-6 py-4">
                          {industry === 'RESTAURANT' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                              <Utensils className="w-3 h-3" /> {t('settings.branches.vertical_restaurant')}
                            </span>
                          ) : industry === 'RETAIL' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:blue-400 border border-blue-200/50 dark:border-blue-500/20">
                              <ShoppingBag className="w-3 h-3" /> {t('settings.branches.vertical_retail')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20">
                              <Layers className="w-3 h-3" /> {t('settings.branches.vertical_hybrid')}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          {branch.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('settings.branches.active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t('settings.branches.inactive')}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <PermissionGuard permission="branches:update">
                            <button
                              onClick={() => handleEdit(branch)}
                              title={t('settings.branches.edit_branch')}
                              className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </PermissionGuard>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {!loading && branches.length > 0 && (
          <div className="border-t border-slate-200/80 dark:border-slate-800 p-4">
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
      </Card>

      {isFormOpen && (
        <BranchForm 
          branch={editingBranch} 
          onClose={handleClose} 
        />
      )}
    </div>
  );
}
