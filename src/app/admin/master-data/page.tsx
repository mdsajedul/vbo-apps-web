"use client";

import React, { useEffect, useState } from 'react';
import { superAdminApi, MasterDataEntry } from '@/lib/api';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Store,
  UtensilsCrossed,
  Pill,
  ShoppingCart,
  Tv,
  Shirt,
  Truck,
  Briefcase,
  Globe,
  ShoppingBag,
  Sparkles,
  Lock,
  Tag,
  Search,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Store,
  UtensilsCrossed,
  Pill,
  ShoppingCart,
  Tv,
  Shirt,
  Truck,
  Briefcase,
  Globe,
  ShoppingBag,
  Sparkles,
  Tag,
  Layers,
};

export default function SuperAdminMasterDataPage() {
  const [activeTab, setActiveTab] = useState<'INDUSTRY_VERTICAL' | 'ECOMMERCE_PLATFORM'>('INDUSTRY_VERTICAL');
  const [entries, setEntries] = useState<MasterDataEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<MasterDataEntry | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    label_bn: '',
    icon: '',
    color: '#3B82F6',
    sort_order: 0,
    is_active: true,
  });

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await superAdminApi.getMasterData({ type: activeTab });
      setEntries(data || []);
    } catch (err: any) {
      setStatusMessage({
        text: err?.response?.data?.message || 'Failed to load master data entries',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
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
      icon: activeTab === 'INDUSTRY_VERTICAL' ? 'Store' : 'Globe',
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
      icon: entry.icon || '',
      color: entry.color || '#3B82F6',
      sort_order: entry.sort_order,
      is_active: entry.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (editingEntry) {
        await superAdminApi.updateMasterData(editingEntry.id, {
          label: formData.label,
          label_bn: formData.label_bn || null,
          icon: formData.icon || null,
          color: formData.color || null,
          sort_order: Number(formData.sort_order),
          is_active: formData.is_active,
        });
        setStatusMessage({ text: `Updated '${formData.label}' successfully`, type: 'success' });
      } else {
        await superAdminApi.createMasterData({
          type: activeTab,
          code: formData.code.trim().toUpperCase(),
          label: formData.label.trim(),
          label_bn: formData.label_bn?.trim() || null,
          icon: formData.icon || null,
          color: formData.color || null,
          sort_order: Number(formData.sort_order),
          is_active: formData.is_active,
        });
        setStatusMessage({ text: `Created '${formData.label}' successfully`, type: 'success' });
      }
      setIsModalOpen(false);
      await loadEntries();
    } catch (err: any) {
      setStatusMessage({
        text: err?.response?.data?.message || 'Failed to save master data entry',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (entry: MasterDataEntry) => {
    try {
      await superAdminApi.updateMasterData(entry.id, {
        is_active: !entry.is_active,
      });
      await loadEntries();
    } catch (err: any) {
      setStatusMessage({
        text: err?.response?.data?.message || 'Failed to toggle status',
        type: 'error',
      });
    }
  };

  const handleDelete = async (entry: MasterDataEntry) => {
    if (entry.is_system) {
      alert('System-level default entries cannot be deleted. You can deactivate them instead.');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${entry.label}?`)) return;

    try {
      await superAdminApi.deleteMasterData(entry.id);
      setStatusMessage({ text: `Deleted '${entry.label}'`, type: 'success' });
      await loadEntries();
    } catch (err: any) {
      setStatusMessage({
        text: err?.response?.data?.message || 'Failed to delete entry',
        type: 'error',
      });
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Re-run platform master data seeding? Existing customized entries will be preserved.')) return;
    setIsSeeding(true);
    try {
      const res = await superAdminApi.seedDefaultMasterData();
      setStatusMessage({
        text: `Seeding completed! (${res?.seededCount ?? 0} entries added)`,
        type: 'success',
      });
      await loadEntries();
    } catch (err: any) {
      setStatusMessage({
        text: err?.response?.data?.message || 'Failed to seed master data',
        type: 'error',
      });
    } finally {
      setIsSeeding(false);
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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Master Data Hub</h1>
              <p className="text-sm text-slate-500">
                Manage global industry verticals and platform-wide integrations available to all tenants.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            Seed Defaults
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-sm font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('INDUSTRY_VERTICAL')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'INDUSTRY_VERTICAL'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Industry Verticals
          </button>
          <button
            onClick={() => setActiveTab('ECOMMERCE_PLATFORM')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'ECOMMERCE_PLATFORM'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            E-Commerce Platforms
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search code or label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <p className="text-sm">Loading master data...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No entries found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Add Entry&quot; or &quot;Seed Defaults&quot; to populate this type.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Icon / Color</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">English Label</th>
                  <th className="py-3 px-4">Bengali Label</th>
                  <th className="py-3 px-4">Sort</th>
                  <th className="py-3 px-4">System</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEntries.map((entry) => {
                  const IconComponent = entry.icon ? ICON_MAP[entry.icon] || Tag : Tag;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: entry.color || '#3B82F6' }}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span className="text-xs text-slate-400 font-mono">{entry.icon || 'default'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                          {entry.code}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">{entry.label}</td>

                      <td className="py-3 px-4 text-slate-600 font-bengali">
                        {entry.label_bn || <span className="text-slate-300 italic">None</span>}
                      </td>

                      <td className="py-3 px-4 text-slate-500">{entry.sort_order}</td>

                      <td className="py-3 px-4">
                        {entry.is_system ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Lock className="w-3 h-3" /> System
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Custom</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
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

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(entry)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!entry.is_system && (
                            <button
                              onClick={() => handleDelete(entry)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Delete"
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
              {editingEntry ? `Edit ${editingEntry.label}` : `Add New ${activeTab === 'INDUSTRY_VERTICAL' ? 'Industry Vertical' : 'E-Commerce Platform'}`}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Machine Code
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingEntry}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. RETAIL"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {editingEntry && (
                  <p className="text-[11px] text-slate-400 mt-0.5">Machine codes cannot be altered once created.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    English Label
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Retail Store"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Bengali Label
                  </label>
                  <input
                    type="text"
                    value={formData.label_bn}
                    onChange={(e) => setFormData({ ...formData, label_bn: e.target.value })}
                    placeholder="খুচরা দোকান"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bengali"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Lucide Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Store">Store</option>
                    <option value="UtensilsCrossed">UtensilsCrossed</option>
                    <option value="Pill">Pill</option>
                    <option value="ShoppingCart">ShoppingCart</option>
                    <option value="Tv">Tv</option>
                    <option value="Shirt">Shirt</option>
                    <option value="Truck">Truck</option>
                    <option value="Briefcase">Briefcase</option>
                    <option value="Globe">Globe</option>
                    <option value="ShoppingBag">ShoppingBag</option>
                    <option value="Tag">Tag</option>
                    <option value="Layers">Layers</option>
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Active in system
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
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingEntry ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
