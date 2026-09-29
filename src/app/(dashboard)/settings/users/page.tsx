"use client";

import { useState, useEffect } from "react";
import { usersApi, rolesApi, branchesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, UserPlus, Mail, Lock, Shield, Eye, EyeOff, Check, 
  MapPin, Pencil, Plus 
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormError } from "@/components/ui/form-error";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useLanguage } from "@/i18n";

const inviteUserSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role_id: z.string().optional(),
  branch_id: z.string().optional(),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

const editUserSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  branch_id: z.string().optional(),
  is_active: z.boolean(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const inviteForm = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role_id: '',
      branch_id: '',
    }
  });

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: '',
      branch_id: '',
      is_active: true,
    }
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersResult, rolesData, branchesResult] = await Promise.all([
        usersApi.getAll({ page: currentPage, limit: itemsPerPage }),
        rolesApi.getAll(),
        branchesApi.getAll()
      ]);
      setUsers(usersResult.data || []);
      if (usersResult.meta) {
        setTotalItems(usersResult.meta.total);
      }
      setRoles(rolesData.data || rolesData || []);
      setBranches(branchesResult.data || branchesResult || []);
    } catch (error) {
      console.error("Failed to load users, roles, or branches", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onInviteSubmit = async (data: InviteUserFormValues) => {
    try {
      await usersApi.create({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role_id: data.role_id || undefined,
        branch_id: data.branch_id || undefined,
      });
      setShowInviteModal(false);
      inviteForm.reset();
      toast.success('Staff member invited successfully');
      fetchData();
    } catch (error) {
      console.error("Failed to invite user", error);
    }
  };

  const onEditSubmit = async (data: EditUserFormValues) => {
    if (!editingUser) return;
    try {
      await usersApi.update(editingUser.id, {
        full_name: data.full_name,
        branch_id: data.branch_id === "" ? null : data.branch_id,
        is_active: data.is_active,
      });
      setShowEditModal(false);
      setEditingUser(null);
      toast.success('User updated successfully');
      fetchData();
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    editForm.reset({
      full_name: user.full_name,
      branch_id: user.branch_id || "",
      is_active: user.is_active,
    });
    setShowEditModal(true);
  };

  const openRolesModal = (user: any) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles.map((r: any) => r.role_id));
    setShowRoleModal(true);
  };

  const toggleRoleSelection = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleRolesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await usersApi.assignRoles(selectedUser.id, selectedRoles);
      setShowRoleModal(false);
      toast.success('User roles updated successfully');
      fetchData();
    } catch (error: any) {
      console.error("Failed to assign roles", error);
      toast.error(error.response?.data?.message || "Failed to update roles.");
    }
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('settings.users.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.users.subtitle')}
            </p>
          </div>
        </div>
        <PermissionGuard permission="users:create">
          <Button 
            onClick={() => setShowInviteModal(true)} 
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" /> {t('settings.users.btn_invite_staff')}
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
                  <th className="px-6 py-4 font-semibold">{t('settings.users.col_staff')}</th>
                  <th className="px-6 py-4 font-semibold">{t('settings.users.col_branch')}</th>
                  <th className="px-6 py-4 font-semibold">{t('settings.users.col_roles')}</th>
                  <th className="px-6 py-4 font-semibold">{t('settings.users.col_status')}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t('settings.users.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>{t('settings.users.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      {t('settings.users.no_users')}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Staff Member */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold text-xs flex items-center justify-center border border-violet-500/20 flex-shrink-0">
                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Branch Access */}
                      <td className="px-6 py-4">
                        {user.branch ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                            <MapPin className="w-3 h-3 text-blue-500" /> {user.branch.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {t('settings.users.all_branches_tenant')}
                          </span>
                        )}
                      </td>

                      {/* Roles */}
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {user.roles.map((ur: any) => (
                            <span 
                              key={ur.role_id} 
                              className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                            >
                              {ur.role.name}
                            </span>
                          ))}
                          {user.roles.length === 0 && (
                            <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                              {t('settings.users.no_roles')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {t('settings.users.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {t('settings.users.inactive')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGuard permission="users:update">
                            <button 
                              onClick={() => openEditModal(user)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold transition-all shadow-xs inline-flex items-center gap-1.5"
                            >
                              <Pencil className="w-3 h-3 text-slate-500" />
                              {t('settings.users.btn_edit')}
                            </button>
                            <button 
                              onClick={() => openRolesModal(user)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all border border-slate-200/60 dark:border-slate-700 inline-flex items-center gap-1.5"
                            >
                              <Shield className="w-3 h-3 text-slate-500" />
                              {t('settings.users.btn_roles')}
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {!isLoading && users.length > 0 && (
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

      {/* ────────────────────────────────────────────────────────────────────────
          INVITE USER MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('settings.users.modal_invite_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.users.modal_invite_subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)}>
            <div className="px-6 py-5 space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.users.full_name_label')}
                </Label>
                <div className="relative">
                  <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="full_name" 
                    {...inviteForm.register('full_name')}
                    placeholder={t('settings.users.full_name_placeholder')}
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800"
                  />
                </div>
                <FormError message={inviteForm.formState.errors.full_name?.message} />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.users.email_label')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email"
                    {...inviteForm.register('email')}
                    placeholder={t('settings.users.email_placeholder')}
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800"
                  />
                </div>
                <FormError message={inviteForm.formState.errors.email?.message} />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.users.password_label')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    {...inviteForm.register('password')}
                    placeholder={t('settings.users.password_placeholder')}
                    className="pl-10 pr-10 rounded-xl border-slate-200 dark:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FormError message={inviteForm.formState.errors.password?.message} />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.users.role_label')}
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    id="role"
                    {...inviteForm.register('role_id')}
                    className="w-full pl-10 pr-4 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('settings.users.role_placeholder')}</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <Label htmlFor="branch" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.users.branch_label')}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    id="branch"
                    {...inviteForm.register('branch_id')}
                    className="w-full pl-10 pr-4 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('settings.users.branch_placeholder')}</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowInviteModal(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('settings.users.btn_cancel')}
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs"
              >
                {t('settings.users.btn_invite')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────
          MANAGE ROLES MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      {showRoleModal && selectedUser && (
        <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
          <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('settings.users.modal_roles_title')}
                  </DialogTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.users.modal_roles_subtitle', { name: selectedUser.full_name })}
                </p>
              </div>
            </div>

            <form onSubmit={handleRolesSubmit}>
              <div className="px-6 py-5 space-y-2.5 max-h-[50vh] overflow-y-auto">
                {roles.map(role => {
                  const isSelected = selectedRoles.includes(role.id);
                  return (
                    <div 
                      key={role.id} 
                      onClick={() => toggleRoleSelection(role.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-2xs' 
                          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {role.name}
                        </div>
                        {role.is_system && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {t('settings.users.system_role_tag')}
                          </div>
                        )}
                      </div>
                      
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRoleModal(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  {t('settings.users.btn_cancel')}
                </Button>
                <PermissionGuard permission="users:update">
                  <Button 
                    type="submit" 
                    className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs"
                  >
                    {t('settings.users.btn_save_roles')}
                  </Button>
                </PermissionGuard>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          EDIT USER MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      {showEditModal && editingUser && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('settings.users.modal_edit_title')}
                  </DialogTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.users.modal_edit_subtitle')}
                </p>
              </div>
            </div>

            <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
              <div className="px-6 py-5 space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit_full_name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.users.full_name_label')}
                  </Label>
                  <Input 
                    id="edit_full_name" 
                    {...editForm.register('full_name')}
                    placeholder={t('settings.users.full_name_placeholder')}
                    className="rounded-xl border-slate-200 dark:border-slate-800"
                  />
                  <FormError message={editForm.formState.errors.full_name?.message} />
                </div>

                {/* Branch Tag */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit_branch" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.users.branch_label')}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      id="edit_branch"
                      {...editForm.register('branch_id')}
                      className="w-full pl-10 pr-4 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">{t('settings.users.branch_placeholder')}</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {t('settings.users.account_status_label')}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {t('settings.users.account_status_hint')}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.watch('is_active')}
                      onChange={(e) => editForm.setValue('is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  {t('settings.users.btn_cancel')}
                </Button>
                <PermissionGuard permission="users:update">
                  <Button 
                    type="submit" 
                    className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs"
                  >
                    {t('settings.users.btn_save_changes')}
                  </Button>
                </PermissionGuard>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
