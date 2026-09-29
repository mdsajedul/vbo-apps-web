'use client';

import React, { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import {
  UtensilsCrossed,
  Tags,
  Plus,
  RefreshCw,
  FolderTree,
  FileEdit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function RestaurantMenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [modifierGroups, setModifierGroups] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'categories' | 'modifiers' | 'items'>('categories');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, mods, menuItems] = await Promise.all([
        restaurantApi.getMenuCategories().catch(() => []),
        restaurantApi.getModifierGroups().catch(() => []),
        restaurantApi.getMenuItems().catch(() => [])
      ]);
      setCategories(cats);
      setModifierGroups(mods);
      setItems(menuItems);
    } catch (error) {
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await restaurantApi.deleteMenuCategory(categoryToDelete);
      toast.success('Category deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete category');
    } finally {
      setCategoryToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Menu Manager</h1>
            <p className="text-xs text-slate-400 mt-1">Configure categories, modifiers, and menu item availability.</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-slate-200 p-1 rounded-2xl w-max shadow-sm">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'categories' ? 'bg-amber-50 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4 inline mr-2" /> Categories
        </button>
        <button
          onClick={() => setActiveTab('modifiers')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'modifiers' ? 'bg-amber-50 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tags className="w-4 h-4 inline mr-2" /> Modifier Groups
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'items' ? 'bg-amber-50 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 inline mr-2" /> Menu Items
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-lg font-bold text-slate-900">Menu Categories</h2>
              <PermissionGuard permission="restaurant_menu:create">
                          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold">
                                          <Plus className="w-4 h-4" /> Add Category
                                        </button>
                          </PermissionGuard>
            </div>
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No categories found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div key={c.id} className="p-4 border rounded-2xl flex justify-between items-start hover:shadow-md transition-shadow bg-slate-50">
                    <div>
                      <h3 className="font-bold text-slate-900">{c.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">Slug: {c.slug}</p>
                    </div>
                    <PermissionGuard permission="restaurant_menu:delete">
                        <button onClick={() => setCategoryToDelete(c.id)} className="text-red-400 hover:text-red-600">
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                        </PermissionGuard>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'modifiers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-lg font-bold text-slate-900">Modifier Groups</h2>
              <PermissionGuard permission="restaurant_menu:create">
                          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold">
                                          <Plus className="w-4 h-4" /> Add Modifier Group
                                        </button>
                          </PermissionGuard>
            </div>
            {modifierGroups.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No modifier groups found.</p>
            ) : (
              <div className="space-y-4">
                {modifierGroups.map((g) => (
                  <div key={g.id} className="p-5 border rounded-2xl bg-white shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">{g.name}</h3>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600">
                        Select {g.min_selections} - {g.max_selections}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.modifiers?.map((m: any) => (
                        <span key={m.id} className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-lg">
                          {m.name} (+৳{(m.price / 100).toFixed(0)})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-lg font-bold text-slate-900">Menu Items (Products)</h2>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No menu items found. Mark products as POS Visible.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="p-4 rounded-tl-xl">Item Name</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Base Price</th>
                      <th className="p-4 rounded-tr-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{item.name}</td>
                        <td className="p-4 text-xs font-mono">{item.sku}</td>
                        <td className="p-4">{item.category?.name || 'Uncategorized'}</td>
                        <td className="p-4">৳ {(item.selling_price / 100).toFixed(0)}</td>
                        <td className="p-4">
                          {item.is_eighty_sixed ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-[10px] font-bold">86'd (Sold Out)</span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">Available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        variant="destructive"
      />
    </div>
  );
}
