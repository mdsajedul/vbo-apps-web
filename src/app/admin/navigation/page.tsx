"use client"
import React, { useEffect, useState } from 'react';
import { navigationApi } from '@/lib/api';
import { DynamicIcon } from '@/components/DynamicIcon';
import { FolderTree, Plus, Edit3, Trash2, Loader2, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function AdminNavigationPage() {
  const confirm = useConfirm();
  const [data, setData] = useState<{ groups: any[]; standaloneItems: any[] }>({
    groups: [],
    standaloneItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Item Form state
  const [groupId, setGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [href, setHref] = useState('');
  const [icon, setIcon] = useState('FolderTree');
  const [featureKey, setFeatureKey] = useState('');
  const [requiredPermissions, setRequiredPermissions] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  // Group Form state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupIcon, setGroupIcon] = useState('FolderTree');
  const [groupFeatureKey, setGroupFeatureKey] = useState('');
  const [groupSortOrder, setGroupSortOrder] = useState(0);

  const openCreateGroupModal = () => {
    setEditingGroup(null);
    setGroupTitle('');
    setGroupIcon('FolderTree');
    setGroupFeatureKey('');
    setGroupSortOrder(data.groups.length + 1);
    setShowGroupModal(true);
  };

  const openEditGroupModal = (group: any) => {
    setEditingGroup(group);
    setGroupTitle(group.title);
    setGroupIcon(group.icon || 'FolderTree');
    setGroupFeatureKey(group.feature_key || '');
    setGroupSortOrder(group.sort_order || 0);
    setShowGroupModal(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: groupTitle,
        icon: groupIcon,
        feature_key: groupFeatureKey || undefined,
        sort_order: Number(groupSortOrder),
      };

      if (editingGroup) {
        await navigationApi.updateGroup(editingGroup.id, payload);
      } else {
        await navigationApi.createGroup(payload);
      }

      setShowGroupModal(false);
      await fetchNavigationData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save navigation group');
    } finally {
      setSaving(false);
    }
  };

  const fetchNavigationData = async () => {
    setLoading(true);
    try {
      const res = await navigationApi.getAdminNavigation();
      setData(res || { groups: [], standaloneItems: [] });
    } catch (err) {
      console.error('Failed to load navigation definitions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigationData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setGroupId('');
    setTitle('');
    setHref('');
    setIcon('ShoppingBag');
    setFeatureKey('');
    setRequiredPermissions('');
    setSortOrder(1);
    setShowItemModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setGroupId(item.group_id || '');
    setTitle(item.title);
    setHref(item.href);
    setIcon(item.icon);
    setFeatureKey(item.feature_key || '');
    setRequiredPermissions((item.required_permissions || []).join(', '));
    setSortOrder(item.sort_order || 0);
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const permsArray = requiredPermissions
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        group_id: groupId || undefined,
        title,
        href,
        icon,
        feature_key: featureKey || undefined,
        required_permissions: permsArray,
        sort_order: Number(sortOrder),
      };

      if (editingItem) {
        await navigationApi.updateItem(editingItem.id, payload);
      } else {
        await navigationApi.createItem(payload);
      }

      setShowItemModal(false);
      await fetchNavigationData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save navigation item');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: any) => {
    try {
      await navigationApi.updateItem(item.id, { is_active: !item.is_active });
      await fetchNavigationData();
    } catch (err) {
      console.error('Failed to toggle item status', err);
    }
  };

  const handleDeleteItem = async (id: string, itemTitle?: string) => {
    const ok = await confirm({
      title: 'Delete Menu Item',
      description: `Are you sure you want to delete ${itemTitle ? `"${itemTitle}"` : 'this navigation item'} from the platform database?`,
      confirmText: 'Delete Menu Item',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await navigationApi.deleteItem(id);
      await fetchNavigationData();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Database Navigation Builder</h1>
          <p className="text-sm text-slate-500 mt-1">Manage sidebar menu items, URLs, icons, feature flags, and required RBAC permission slugs stored in PostgreSQL.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={openCreateGroupModal}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Navigation Group</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Navigation Groups List */}
          {data.groups.map((group) => (
            <div key={group.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shadow-2xs">
                    <DynamicIcon name={group.icon || 'FolderTree'} size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{group.title}</h3>
                  {group.feature_key && (
                    <span className="text-xs font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-md">
                      feature: {group.feature_key}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400 font-mono">order: {group.sort_order}</span>
                  <button
                    onClick={() => openEditGroupModal(group)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg transition-colors cursor-pointer"
                    title="Edit Group"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((item: any) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      item.is_active ? 'bg-slate-50 border-slate-200' : 'bg-red-50/50 border-red-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 shadow-2xs">
                        <DynamicIcon name={item.icon} size={18} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.href}</span>
                        </div>
                        {item.required_permissions && item.required_permissions.length > 0 && (
                          <div className="flex items-center space-x-1 text-[10px] text-indigo-600 font-medium mt-0.5">
                            <Key className="w-3 h-3" />
                            <span>Perms: {item.required_permissions.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(item)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg transition-colors"
                        title={item.is_active ? 'Disable' : 'Enable'}
                      >
                        {item.is_active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-red-500" />}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? `Edit Menu Item: ${editingItem.title}` : 'Add New Navigation Item'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-slate-900 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Parent Navigation Group</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="">Standalone Root Item (e.g. Dashboard/POS)</option>
                  {data.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Item Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Purchase Orders"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Route Path (Href)</label>
                  <input
                    type="text"
                    required
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                    placeholder="e.g. /procurement"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lucide Icon Name</label>
                  <input
                    type="text"
                    required
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="e.g. ShoppingBag"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Feature Flag Key (Optional)</label>
                  <input
                    type="text"
                    value={featureKey}
                    onChange={(e) => setFeatureKey(e.target.value)}
                    placeholder="e.g. procurement"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Required Employee Permissions (Comma-separated)</label>
                <input
                  type="text"
                  value={requiredPermissions}
                  onChange={(e) => setRequiredPermissions(e.target.value)}
                  placeholder="e.g. manage_procurement, view_inventory"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400">If set, employee roles without these permission slugs will not see this menu item.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Order</label>
                <input
                  type="number"
                  required
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGroup ? `Edit Group: ${editingGroup.title}` : 'Add Navigation Group'}
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-900 text-lg font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Group Title</label>
                <input
                  type="text"
                  required
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="e.g. Inventory"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lucide Icon Name</label>
                  <input
                    type="text"
                    required
                    value={groupIcon}
                    onChange={(e) => setGroupIcon(e.target.value)}
                    placeholder="e.g. Boxes"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Feature Flag Key (Optional)</label>
                  <input
                    type="text"
                    value={groupFeatureKey}
                    onChange={(e) => setGroupFeatureKey(e.target.value)}
                    placeholder="e.g. inventory"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Order</label>
                <input
                  type="number"
                  required
                  value={groupSortOrder}
                  onChange={(e) => setGroupSortOrder(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingGroup ? 'Save Changes' : 'Create Group'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
