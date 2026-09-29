'use client';

import React, { useState, useEffect } from 'react';
import { masterDataApi, MasterDataEntry } from '@/lib/api';
import { toast } from 'sonner';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  Smartphone,
  ClipboardCheck,
  AlertTriangle,
  ShieldAlert,
  Truck,
  Clock,
  UserCheck,
  Phone,
  Globe,
  Users,
  Share2,
  MoreHorizontal,
  Lock,
  Tag,
  Search,
  RefreshCw,
} from 'lucide-react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useLanguage } from '@/i18n';

const ICON_MAP: Record<string, React.ElementType> = {
  CreditCard,
  Banknote,
  Smartphone,
  ClipboardCheck,
  AlertTriangle,
  ShieldAlert,
  Truck,
  Clock,
  UserCheck,
  Phone,
  Globe,
  Users,
  Share2,
  MoreHorizontal,
  Tag,
  Layers,
};

type MasterDataTab = 'PAYMENT_METHOD' | 'ADJUSTMENT_REASON' | 'LEAD_SOURCE';

const TAB_CONFIG: Record<MasterDataTab, { title: string; description: string; defaultIcon: string }> = {
  PAYMENT_METHOD: {
    title: 'Payment Methods',
    description: 'Configure payment options accepted at POS checkout and Invoice payments.',
    defaultIcon: 'Banknote',
  },
  ADJUSTMENT_REASON: {
    title: 'Stock Adjustment Reasons',
    description: 'Define audit reasons for manual stock corrections and inventory reconciliations.',
    defaultIcon: 'ClipboardCheck',
  },
  LEAD_SOURCE: {
    title: 'CRM Lead Sources',
    description: 'Track where prospective customers originate when entering your sales pipeline.',
    defaultIcon: 'UserCheck',
  },
};

export default function TenantMasterDataSettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<MasterDataTab>('PAYMENT_METHOD');
  const [entries, setEntries] = useState<MasterDataEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<MasterDataEntry | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    label_bn: '',
    icon: 'Banknote',
    color: '#3B82F6',
    sort_order: 0,
    is_active: true,
  });

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await masterDataApi.getAll({ type: activeTab, active_only: false });
      setEntries(data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [activeTab]);

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormData({
      code: '',
      label: '',
      label_bn: '',
      icon: TAB_CONFIG[activeTab].defaultIcon,
      color: '#3B82F6',
      sort_order: entries.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: MasterDataEntry) => {
    setEditingEntry(entry);
    setFormData({
      code: entry.code,
      label: entry.label,
      label_bn: entry.label_bn || '',
      icon: entry.icon || TAB_CONFIG[activeTab].defaultIcon,
      color: entry.color || '#3B82F6',
      sort_order: entry.sort_order,
      is_active: entry.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingEntry) {
        await masterDataApi.update(editingEntry.id, {
          label: formData.label.trim(),
          label_bn: formData.label_bn?.trim() || null,
          icon: formData.icon || null,
          color: formData.color || null,
          sort_order: Number(formData.sort_order),
          is_active: formData.is_active,
        });
        toast.success(`Updated "${formData.label}" successfully`);
      } else {
        await masterDataApi.create({
          type: activeTab,
          code: formData.code.trim().toUpperCase(),
          label: formData.label.trim(),
          label_bn: formData.label_bn?.trim() || null,
          icon: formData.icon || null,
          color: formData.color || null,
          sort_order: Number(formData.sort_order),
          is_active: formData.is_active,
        });
        toast.success(`Created "${formData.label}" successfully`);
      }
      setIsModalOpen(false);
      await loadEntries();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save master data entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (entry: MasterDataEntry) => {
    try {
      await masterDataApi.update(entry.id, {
        is_active: !entry.is_active,
      });
      toast.success(`${entry.label} is now ${!entry.is_active ? 'Active' : 'Inactive'}`);
      await loadEntries();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (entry: MasterDataEntry) => {
    if (entry.is_system) {
      toast.error('System defaults cannot be deleted. You can deactivate them instead.');
      return;
    }
    if (!confirm(`Are you sure you want to deactivate/delete "${entry.label}"?`)) return;

    try {
      await masterDataApi.delete(entry.id);
      toast.success(`Removed "${entry.label}"`);
      await loadEntries();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete entry');
    }
  };

  const filteredEntries = entries.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.label_bn && item.label_bn.toLowerCase().includes(q))
    );
  });

  return (
    <PermissionGuard permission="settings:manage">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Data Settings</h1>
              <p className="text-sm text-slate-500">
                {TAB_CONFIG[activeTab].description}
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm w-fit"
          >
            <Plus className="w-4 h-4" />
            Add Custom Entry
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('PAYMENT_METHOD')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'PAYMENT_METHOD'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setActiveTab('ADJUSTMENT_REASON')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'ADJUSTMENT_REASON'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Adjustment Reasons
            </button>
            <button
              onClick={() => setActiveTab('LEAD_SOURCE')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'LEAD_SOURCE'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lead Sources
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Entries Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm">Loading options...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-600">No options found</p>
              <p className="text-xs text-slate-400 mt-1">Click &quot;Add Custom Entry&quot; to configure one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Icon</th>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Display Label</th>
                    <th className="py-3.5 px-4">Bengali Label</th>
                    <th className="py-3.5 px-4">Sort</th>
                    <th className="py-3.5 px-4">System Tag</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredEntries.map((entry) => {
                    const IconComponent = entry.icon ? ICON_MAP[entry.icon] || Tag : Tag;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: entry.color || '#3B82F6' }}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                            {entry.code}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-900">{entry.label}</td>

                        <td className="py-3.5 px-4 text-slate-600 font-bengali">
                          {entry.label_bn || <span className="text-slate-300 italic">None</span>}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">{entry.sort_order}</td>

                        <td className="py-3.5 px-4">
                          {entry.is_system ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-400" /> Default
                            </span>
                          ) : (
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Custom
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleActive(entry)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition ${
                              entry.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {entry.is_active ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-slate-500" /> Inactive
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(entry)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Label / Icon"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!entry.is_system && (
                              <button
                                onClick={() => handleDelete(entry)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <h2 className="text-lg font-bold text-slate-900">
                {editingEntry ? `Edit ${editingEntry.label}` : `Add Custom ${TAB_CONFIG[activeTab].title.slice(0, -1)}`}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    System Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingEntry}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. UPAY"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editingEntry ? (
                    <p className="text-[11px] text-slate-400 mt-0.5">Machine codes cannot be modified.</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5">Stored with transactions (uppercase, no spaces).</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Display Label (EN)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="e.g. Upay Wallet"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Bengali Label (BN)
                    </label>
                    <input
                      type="text"
                      value={formData.label_bn}
                      onChange={(e) => setFormData({ ...formData, label_bn: e.target.value })}
                      placeholder="উপায়"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bengali"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Icon
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Banknote">Banknote (Cash)</option>
                      <option value="CreditCard">CreditCard</option>
                      <option value="Smartphone">Smartphone (MFS)</option>
                      <option value="ClipboardCheck">ClipboardCheck</option>
                      <option value="AlertTriangle">AlertTriangle</option>
                      <option value="ShieldAlert">ShieldAlert</option>
                      <option value="Truck">Truck</option>
                      <option value="Clock">Clock</option>
                      <option value="UserCheck">UserCheck</option>
                      <option value="Phone">Phone</option>
                      <option value="Globe">Globe</option>
                      <option value="Users">Users</option>
                      <option value="Share2">Share2</option>
                      <option value="MoreHorizontal">MoreHorizontal</option>
                      <option value="Tag">Tag</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-9 h-9 p-0.5 border border-slate-200 rounded cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-500">{formData.color}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="tenant_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="tenant_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : editingEntry ? 'Save Changes' : 'Create Option'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
