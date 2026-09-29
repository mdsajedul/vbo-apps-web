"use client";

import { useState, useEffect, useMemo } from "react";
import { rolesApi } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormError } from "@/components/ui/form-error";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { 
  Plus, Check, X, Shield, Lock, Key, Box, Package, ShoppingCart, 
  Receipt, Users, Truck, Utensils, Globe, Calculator, LineChart, 
  Settings, FolderTree 
} from "lucide-react";
import { useLanguage } from "@/i18n";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  slug: z.string().min(1, "Unique identifier is required"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface MenuGroup {
  id: string;
  title: string;
  order: number;
}

const MENU_GROUPS: Record<string, MenuGroup> = {
  catalog: { id: 'catalog', title: 'Catalog & Products', order: 1 },
  inventory: { id: 'inventory', title: 'Inventory & Logistics', order: 2 },
  sales: { id: 'sales', title: 'Sales & Billing', order: 3 },
  invoices: { id: 'invoices', title: 'Invoices', order: 4 },
  customers: { id: 'customers', title: 'Customers & Loyalty', order: 5 },
  procurement: { id: 'procurement', title: 'Procurement & Suppliers', order: 6 },
  accounting: { id: 'accounting', title: 'Accounting', order: 7 },
  restaurant: { id: 'restaurant', title: 'Restaurant Vertical', order: 8 },
  ecommerce: { id: 'ecommerce', title: 'E-commerce Channels', order: 9 },
  analytics: { id: 'analytics', title: 'BI & Analytics', order: 10 },
  settings: { id: 'settings', title: 'Administration & Settings', order: 11 },
  other: { id: 'other', title: 'Other Modules', order: 12 }
};

const MODULE_TO_GROUP: Record<string, string> = {
  catalog: 'catalog',
  products: 'catalog',
  categories: 'catalog',
  brands: 'catalog',

  inventory: 'inventory',
  inventory_batches: 'inventory',
  inventory_transfers: 'inventory',
  warehouse: 'inventory',

  sales: 'sales',
  sales_returns: 'sales',
  pos: 'sales',

  invoices: 'invoices',

  customers: 'customers',
  crm: 'customers',
  loyalty: 'customers',
  gift_cards: 'customers',

  procurement: 'procurement',
  suppliers: 'procurement',

  restaurant: 'restaurant',
  restaurant_kitchen: 'restaurant',
  restaurant_menu: 'restaurant',
  restaurant_recipes: 'restaurant',
  restaurant_tables: 'restaurant',
  restaurant_reservations: 'restaurant',
  restaurant_analytics: 'restaurant',
  restaurant_delivery_partners: 'restaurant',

  ecommerce: 'ecommerce',
  accounting: 'accounting',

  reports: 'analytics',
  analytics: 'analytics',
  bi: 'analytics',

  users: 'settings',
  roles: 'settings',
  organizations: 'settings',
  branches: 'settings',
  settings: 'settings',
  tax_rates: 'settings',
  payments: 'settings',
  subscriptions: 'settings',
  upload: 'settings',
};

export default function RolesPage() {
  const { t } = useLanguage();
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      slug: '',
    }
  });

  const [showPermsModal, setShowPermsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesResult, permsData] = await Promise.all([
        rolesApi.getAll({ page: currentPage, limit: itemsPerPage }),
        rolesApi.getPermissions()
      ]);
      setRoles(rolesResult.data || []);
      if (rolesResult.meta) {
        setTotalItems(rolesResult.meta.total);
      }
      setAllPermissions(permsData || []);
    } catch (error) {
      console.error("Failed to load roles", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateSubmit = async (data: RoleFormValues) => {
    try {
      await rolesApi.create({
        name: data.name,
        slug: data.slug
      });
      setShowCreateModal(false);
      roleForm.reset();
      toast.success('Role created successfully');
      fetchData();
    } catch (error) {
      console.error("Failed to create role", error);
    }
  };

  const handlePermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || selectedRole.is_system) return;
    
    setIsSavingPerms(true);
    try {
      await rolesApi.assignPermissions(selectedRole.id, selectedPerms);
      toast.success('Permissions updated successfully');
      setShowPermsModal(false);
      fetchData();
    } catch (error: any) {
      console.error("Failed to assign permissions", error);
      toast.error(error.response?.data?.message || "Failed to update permissions.");
    } finally {
      setIsSavingPerms(false);
    }
  };

  const openPermsModal = (role: any) => {
    setSelectedRole(role);
    setSelectedPerms(role.permissions ? role.permissions.map((rp: any) => rp.permission_id) : []);
    setShowPermsModal(true);
  };

  const togglePermSelection = (permId: string) => {
    if (selectedRole?.is_system) return;
    if (selectedPerms.includes(permId)) {
      setSelectedPerms(selectedPerms.filter(id => id !== permId));
    } else {
      setSelectedPerms([...selectedPerms, permId]);
    }
  };

  // Group permissions for the modal matrix
  const modalGroupedData = useMemo(() => {
    const groups: Record<string, { 
      group: MenuGroup; 
      modules: Record<string, any[]>;
      totalPerms: number;
      selectedCount: number;
    }> = {};

    allPermissions.forEach((perm) => {
      const groupId = MODULE_TO_GROUP[perm.module.toLowerCase()] || 'other';
      if (!groups[groupId]) {
        groups[groupId] = {
          group: MENU_GROUPS[groupId] || MENU_GROUPS.other,
          modules: {},
          totalPerms: 0,
          selectedCount: 0,
        };
      }

      if (!groups[groupId].modules[perm.module]) {
        groups[groupId].modules[perm.module] = [];
      }

      groups[groupId].modules[perm.module].push(perm);
      groups[groupId].totalPerms += 1;
      if (selectedPerms.includes(perm.id)) {
        groups[groupId].selectedCount += 1;
      }
    });

    return Object.values(groups).sort((a, b) => a.group.order - b.group.order);
  }, [allPermissions, selectedPerms]);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('settings.roles.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.roles.subtitle')}
            </p>
          </div>
        </div>
        <PermissionGuard permission="roles:create">
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" /> {t('settings.roles.btn_create_role')}
          </Button>
        </PermissionGuard>
      </div>

      {/* Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('settings.roles.col_name')}</th>
                  <th className="px-6 py-4 font-semibold">{t('settings.roles.col_slug')}</th>
                  <th className="px-6 py-4 font-semibold">{t('settings.roles.col_type')}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t('settings.roles.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>{t('settings.roles.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                      {t('settings.roles.no_roles')}
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {role.name}
                      </td>
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">
                        {role.slug}
                      </td>
                      <td className="px-6 py-4">
                        {role.is_system ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                            {t('settings.roles.type_system')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {t('settings.roles.type_custom')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <PermissionGuard permission="roles:update">
                          {role.is_system ? (
                            <button
                              onClick={() => openPermsModal(role)}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold transition-all shadow-xs"
                            >
                              {t('settings.roles.btn_view_perms')}
                            </button>
                          ) : (
                            <button
                              onClick={() => openPermsModal(role)}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all border border-indigo-200/60 dark:border-indigo-500/20"
                            >
                              {t('settings.roles.btn_edit_perms')}
                            </button>
                          )}
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {!isLoading && roles.length > 0 && (
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
        )}
      </Card>

      {/* Create Custom Role Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('settings.roles.modal_create_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.roles.modal_create_subtitle')}
              </p>
            </div>
          </div>
          <form onSubmit={roleForm.handleSubmit(onCreateSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.roles.role_name_label')}
                </Label>
                <Input 
                  id="name" 
                  {...roleForm.register('name')} 
                  onChange={e => {
                    const newName = e.target.value;
                    roleForm.setValue('name', newName, { shouldValidate: true });
                    roleForm.setValue('slug', slugify(newName).replace(/-/g, '_'), { shouldValidate: true });
                  }} 
                  placeholder={t('settings.roles.role_name_placeholder')}
                  className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
                <FormError message={roleForm.formState.errors.name?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.roles.role_slug_label')}
                </Label>
                <Input 
                  id="slug" 
                  {...roleForm.register('slug')} 
                  onChange={e => {
                    roleForm.setValue('slug', e.target.value.toLowerCase().replace(/\s+/g, '_'), { shouldValidate: true });
                  }} 
                  placeholder={t('settings.roles.role_slug_placeholder')}
                  className="rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                />
                <FormError message={roleForm.formState.errors.slug?.message} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700" onClick={() => setShowCreateModal(false)}>
                {t('settings.roles.btn_cancel')}
              </Button>
              <Button type="submit" className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs">
                {t('settings.roles.btn_create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Matrix Modal */}
      <Dialog open={showPermsModal} onOpenChange={setShowPermsModal}>
        <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh] p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Modal Header (Separated) */}
          <div className="px-7 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                  {selectedRole?.is_system ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Key className="w-3.5 h-3.5" />
                  )}
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {selectedRole?.is_system ? t('settings.roles.modal_perms_title_view') : t('settings.roles.modal_perms_title_edit')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedRole?.is_system ? (
                  <span>{t('settings.roles.modal_perms_subtitle_view')} <strong className="text-slate-800 dark:text-slate-200 font-semibold">{selectedRole?.name}</strong> ({t('settings.roles.type_system')})</span>
                ) : (
                  <span>{t('settings.roles.modal_perms_subtitle_edit')} <strong className="text-slate-800 dark:text-slate-200 font-semibold">{selectedRole?.name}</strong></span>
                )}
              </p>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">{t('settings.roles.legend_granted')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"></div>
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('settings.roles.legend_not_granted')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 dark:text-slate-500 text-sm leading-none">—</span>
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('settings.roles.legend_na')}</span>
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <form onSubmit={handlePermsSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
              {modalGroupedData.map(({ group, modules, totalPerms, selectedCount }) => (
                <div 
                  key={group.id} 
                  className="bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs"
                >
                  {/* Category Header */}
                  <div className="px-5 py-3 bg-white dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {group.title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {selectedCount} of {totalPerms}
                    </span>
                  </div>

                  {/* Matrix Table inside Category Card */}
                  <div className="p-2 sm:p-3">
                    {/* Header Columns */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40">
                      <div className="col-span-6 font-semibold">{t('settings.roles.col_matrix_module')}</div>
                      <div className="col-span-6 grid grid-cols-4 text-center font-semibold">
                        <div>{t('settings.roles.col_matrix_create')}</div>
                        <div>{t('settings.roles.col_matrix_read')}</div>
                        <div>{t('settings.roles.col_matrix_update')}</div>
                        <div>{t('settings.roles.col_matrix_delete')}</div>
                      </div>
                    </div>

                    {/* Modules in Category */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {Object.entries(modules).map(([moduleName, perms]) => {
                        const createPerm = perms.find(p => p.action.toLowerCase() === 'create');
                        const readPerm = perms.find(p => p.action.toLowerCase() === 'read');
                        const updatePerm = perms.find(p => p.action.toLowerCase() === 'update');
                        const deletePerm = perms.find(p => p.action.toLowerCase() === 'delete');

                        const extraPerms = perms.filter(p => !['create', 'read', 'update', 'delete'].includes(p.action.toLowerCase()));

                        const renderActionCell = (perm: any) => {
                          if (!perm) {
                            return <span className="text-slate-300 dark:text-slate-600 font-bold text-sm select-none">—</span>;
                          }
                          const isChecked = selectedPerms.includes(perm.id);
                          return (
                            <button
                              type="button"
                              disabled={selectedRole?.is_system}
                              onClick={() => togglePermSelection(perm.id)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center mx-auto transition-all ${
                                isChecked
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-white dark:bg-slate-900'
                              } ${selectedRole?.is_system ? 'cursor-default opacity-75' : 'cursor-pointer'}`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          );
                        };

                        return (
                          <div 
                            key={moduleName} 
                            className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-white dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                          >
                            {/* Module Name */}
                            <div className="col-span-6">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                {moduleName.replace(/_/g, ' ')}
                              </span>
                              {extraPerms.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  {extraPerms.map(ep => {
                                    const isChecked = selectedPerms.includes(ep.id);
                                    return (
                                      <button
                                        key={ep.id}
                                        type="button"
                                        disabled={selectedRole?.is_system}
                                        onClick={() => togglePermSelection(ep.id)}
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                                          isChecked
                                            ? 'bg-indigo-600 text-white border-transparent'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        } ${selectedRole?.is_system ? 'cursor-default' : 'cursor-pointer'}`}
                                      >
                                        <span className={`w-3 h-3 rounded-xs flex items-center justify-center ${isChecked ? 'bg-white/20' : 'border border-slate-300'}`}>
                                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </span>
                                        <span className="capitalize">{ep.action}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* 4 Action Columns */}
                            <div className="col-span-6 grid grid-cols-4 items-center text-center">
                              <div>{renderActionCell(createPerm)}</div>
                              <div>{renderActionCell(readPerm)}</div>
                              <div>{renderActionCell(updatePerm)}</div>
                              <div>{renderActionCell(deletePerm)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-7 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.roles.perms_selected_ratio', { selected: selectedPerms.length, total: allPermissions.length })}
              </span>

              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700" 
                  onClick={() => setShowPermsModal(false)}
                >
                  {selectedRole?.is_system ? t('settings.branch_form.btn_cancel') : t('settings.roles.btn_cancel')}
                </Button>
                {!selectedRole?.is_system && (
                  <PermissionGuard permission="roles:update">
                    <Button 
                      type="submit" 
                      disabled={isSavingPerms}
                      className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs"
                    >
                      {isSavingPerms ? t('settings.roles.saving_perms') : t('settings.roles.btn_save_perms')}
                    </Button>
                  </PermissionGuard>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
