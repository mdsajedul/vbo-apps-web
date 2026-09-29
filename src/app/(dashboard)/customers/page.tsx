'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { customersApi } from '@/lib/api';
import { 
  Search, Plus, Edit2, Trash2, Users, Receipt, 
  Sparkles, Gift, Phone, Mail, ArrowUpRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

const customerSchema = z.object({
  name: z.string().min(1, 'Full Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: ''
    }
  });

  const fetchCustomers = async (q?: string) => {
    setLoading(true);
    try {
      const result = await customersApi.getAll({ q, page: currentPage, limit: itemsPerPage });
      setCustomers(result.data || []);
      if (result.meta) {
        setTotalItems(result.meta.total);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(search);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, currentPage, itemsPerPage]);

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      const payload = {
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
      };

      if (editingId) {
        await customersApi.update(editingId, payload);
        toast.success(t('customers.customer_saved_success'));
      } else {
        await customersApi.create(payload);
        toast.success(t('customers.customer_saved_success'));
      }
      setIsModalOpen(false);
      fetchCustomers(search);
    } catch (error: any) {
      // Global interceptor handles error toasts
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    const ok = await confirm({
      title: t('customers.delete_confirm_title'),
      description: t('customers.delete_confirm_desc'),
      confirmText: t('customers.delete_confirm_title'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await customersApi.delete(id);
      toast.success(t('customers.customer_deleted_success'));
      fetchCustomers(search);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('customers.customer_delete_failed'));
    }
  };

  const openModal = (customer?: any) => {
    if (customer) {
      setEditingId(customer.id);
      form.reset({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      setEditingId(null);
      form.reset({ name: '', phone: '', email: '', address: '' });
    }
    setIsModalOpen(true);
  };

  // Quick stats summary
  const stats = useMemo(() => {
    const totalSpentSum = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
    const totalOrdersSum = customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0);
    return {
      count: totalItems || customers.length,
      spent: totalSpentSum,
      orders: totalOrdersSum,
    };
  }, [customers, totalItems]);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('customers.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('customers.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/customers/loyalty">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-amber-500/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('customers.loyalty_title')}</span>
            </Button>
          </Link>
          <Link href="/customers/gift-cards">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
            >
              <Gift className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('customers.gift_cards_title')}</span>
            </Button>
          </Link>
          <PermissionGuard permission="customers:create">
            <Button
              onClick={() => openModal()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('customers.add_customer')}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('customers.stat_total_members')}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.count.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('sales.total_transactions')}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.orders.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('invoices.total_collected')}
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                ৳ {(stats.spent / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder={t('customers.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {t('invoices.showing_entries', { start: customers.length ? ((currentPage - 1) * itemsPerPage) + 1 : 0, end: Math.min(currentPage * itemsPerPage, totalItems || customers.length), total: totalItems || customers.length })}
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('customers.col_name')}</th>
                  <th className="px-6 py-4 font-semibold">{t('customers.col_phone')}</th>
                  <th className="px-6 py-4 font-semibold text-center">{t('sales.total_transactions')}</th>
                  <th className="px-6 py-4 font-semibold">{t('invoices.col_amount')}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t('customers.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{t('customers.no_customers')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const initials = customer.name
                      ? customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'CU';

                    return (
                      <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        {/* Customer Avatar & Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center flex-shrink-0 border border-rose-500/20 text-xs shadow-2xs">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white leading-tight">
                                {customer.name}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {customer.address || ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5 text-xs">
                            {customer.phone ? (
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{customer.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[180px]">{customer.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Purchases */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 font-mono">
                            <Receipt className="w-3.5 h-3.5 text-slate-400" />
                            {customer.total_purchases || 0}
                          </span>
                        </td>

                        {/* Total Spent */}
                        <td className="px-6 py-4">
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            ৳ {((customer.total_spent || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <PermissionGuard permission="customers:update">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openModal(customer)}
                                className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 shadow-2xs"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                {t('common.edit')}
                              </Button>
                            </PermissionGuard>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(customer.id, customer.name)}
                              className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && customers.length > 0 && (
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

      {/* ────────────────────────────────────────────────────────────────────────
          ADD / EDIT CUSTOMER MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {editingId ? t('customers.modal_edit_title') : t('customers.modal_create_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('customers.modal_subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('customers.field_name')} <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...form.register('name')}
                  placeholder={t('customers.field_name_placeholder')}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
                <FormError message={form.formState.errors.name?.message} />
              </div>
              
              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('customers.field_phone')}
                  </label>
                  <Input
                    type="tel"
                    {...form.register('phone')}
                    placeholder={t('customers.field_phone_placeholder')}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                  <FormError message={form.formState.errors.phone?.message} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('customers.field_email')}
                  </label>
                  <Input
                    type="email"
                    {...form.register('email')}
                    placeholder={t('customers.field_email_placeholder')}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <FormError message={form.formState.errors.email?.message} />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('customers.field_address')}
                </label>
                <textarea
                  {...form.register('address')}
                  rows={3}
                  placeholder={t('customers.field_address_placeholder')}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <FormError message={form.formState.errors.address?.message} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('common.cancel')}
              </Button>
              <PermissionGuard permission="customers:create">
                <Button
                  type="submit"
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs"
                >
                  {t('customers.btn_save_customer')}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
