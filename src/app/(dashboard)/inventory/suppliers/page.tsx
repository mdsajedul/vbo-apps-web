'use client';

import { useState, useEffect } from 'react';
import { suppliersApi } from '@/lib/api';
import { 
  Users, Plus, Edit2, Trash2, ArrowLeft, 
  Boxes, Mail, Phone, MapPin, Check, X, Building2 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useTranslation } from '@/i18n';

const supplierSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: ''
    }
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const result = await suppliersApi.getAll({ page: currentPage, limit: itemsPerPage });
      setSuppliers(result.data || []);
      if (result.meta) {
        setTotalItems(result.meta.total);
      }
    } catch (error) {
      console.error(error);
      toast.error(t('inventory.suppliers.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, itemsPerPage]);

  const handleOpenModal = (supplier: any = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.reset({
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || ''
      });
    } else {
      setEditingSupplier(null);
      form.reset({ name: '', contact_name: '', email: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: SupplierFormValues) => {
    try {
      const payload = {
        name: data.name.trim(),
        contact_name: data.contact_name?.trim() || undefined,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        address: data.address?.trim() || undefined,
      };

      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, payload);
        toast.success(t('inventory.supplier_modal.success_update'));
      } else {
        await suppliersApi.create(payload);
        toast.success(t('inventory.supplier_modal.success_create'));
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || t('inventory.supplier_modal.save_error'));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: t('inventory.suppliers.delete_confirm_title'),
      description: t('inventory.suppliers.delete_confirm_desc', { name }),
      confirmText: t('inventory.suppliers.delete_btn'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await suppliersApi.delete(id);
      toast.success(t('inventory.suppliers.delete_success'));
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('inventory.suppliers.delete_error'));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/inventory">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('inventory.suppliers.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('inventory.suppliers.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/inventory">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold px-3.5 py-2 shadow-2xs"
            >
              <Boxes className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('inventory.suppliers.btn_overview')}</span>
            </Button>
          </Link>
          <PermissionGuard permission="suppliers:create">
            <Button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('inventory.suppliers.btn_register')}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('inventory.suppliers.table_title')}</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">{t('inventory.suppliers.vendors_count', { count: suppliers.length })}</span>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>{t('inventory.suppliers.loading')}</span>
              </div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('inventory.suppliers.no_suppliers')}</p>
                <p className="text-xs text-slate-400">{t('inventory.suppliers.no_suppliers_subtitle')}</p>
                <PermissionGuard permission="suppliers:create">
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenModal()}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                  >
                    {t('inventory.suppliers.add_first_btn')}
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t('inventory.suppliers.col_company')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.suppliers.col_contact')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.suppliers.col_email')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.suppliers.col_phone')}</th>
                    <th className="px-6 py-4 text-right font-semibold">{t('inventory.suppliers.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 font-bold text-xs">
                            {supplier.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{supplier.name}</div>
                            {supplier.address && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{supplier.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {supplier.contact_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
                        {supplier.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {supplier.email}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
                        {supplier.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {supplier.phone}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          <PermissionGuard permission="suppliers:update">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenModal(supplier)}
                              className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 px-3 shadow-2xs gap-1.5"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{t('inventory.suppliers.edit_btn')}</span>
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="suppliers:delete">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(supplier.id, supplier.name)}
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
          
          {!loading && suppliers.length > 0 && (
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

      {/* Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingSupplier ? t('inventory.supplier_modal.edit_title') : t('inventory.supplier_modal.create_title')}
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.supplier_modal.company_label')}</label>
                <Input
                  {...form.register('name')}
                  placeholder={t('inventory.supplier_modal.company_placeholder')}
                  className={`h-10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                <FormError message={form.formState.errors.name?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.supplier_modal.contact_label')}</label>
                <Input
                  {...form.register('contact_name')}
                  placeholder={t('inventory.supplier_modal.contact_placeholder')}
                  className="h-10 rounded-xl text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
                <FormError message={form.formState.errors.contact_name?.message} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.supplier_modal.email_label')}</label>
                  <Input
                    type="email"
                    {...form.register('email')}
                    placeholder={t('inventory.supplier_modal.email_placeholder')}
                    className={`h-10 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                  <FormError message={form.formState.errors.email?.message} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.supplier_modal.phone_label')}</label>
                  <Input
                    {...form.register('phone')}
                    placeholder={t('inventory.supplier_modal.phone_placeholder')}
                    className="h-10 rounded-xl text-xs font-mono border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                  <FormError message={form.formState.errors.phone?.message} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.supplier_modal.address_label')}</label>
                <Input
                  {...form.register('address')}
                  placeholder={t('inventory.supplier_modal.address_placeholder')}
                  className="h-10 rounded-xl text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
                <FormError message={form.formState.errors.address?.message} />
              </div>
              
              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  {t('inventory.supplier_modal.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-5 shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('inventory.supplier_modal.save')}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
