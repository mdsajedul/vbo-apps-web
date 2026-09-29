'use client';

import React, { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Bike, Plus, Search, Trash2, Edit, Phone, Truck, Percent, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

interface DeliveryPartner {
  id: string;
  name: string;
  type: 'OWN_RIDER' | 'THIRD_PARTY';
  phone?: string;
  vehicle_type?: string;
  commission_pct?: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
}

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<{id: string, name: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'OWN_RIDER',
    phone: '',
    vehicle_type: 'Motorcycle',
    commission_pct: '',
    is_active: true,
    notes: '',
  });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await restaurantApi.getDeliveryPartners();
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load delivery partners', err);
      toast.error('Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleOpenAddModal = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      type: 'OWN_RIDER',
      phone: '',
      vehicle_type: 'Motorcycle',
      commission_pct: '',
      is_active: true,
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (partner: DeliveryPartner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      type: partner.type || 'OWN_RIDER',
      phone: partner.phone || '',
      vehicle_type: partner.vehicle_type || 'Motorcycle',
      commission_pct: partner.commission_pct !== undefined && partner.commission_pct !== null ? String(partner.commission_pct) : '',
      is_active: partner.is_active,
      notes: partner.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Partner name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      phone: formData.phone.trim() || undefined,
      vehicle_type: formData.vehicle_type.trim() || undefined,
      commission_pct: formData.commission_pct ? parseFloat(formData.commission_pct) : undefined,
      is_active: formData.is_active,
      notes: formData.notes.trim() || undefined,
    };

    try {
      if (editingPartner) {
        await restaurantApi.updateDeliveryPartner(editingPartner.id, payload);
        toast.success('Delivery partner updated successfully!');
      } else {
        await restaurantApi.createDeliveryPartner(payload);
        toast.success('New delivery partner created!');
      }
      setShowModal(false);
      fetchPartners();
    } catch (err) {
      console.error('Failed to save delivery partner', err);
      toast.error('Failed to save delivery partner');
    }
  };

  const handleDelete = async () => {
    if (!partnerToDelete) return;
    try {
      await restaurantApi.deleteDeliveryPartner(partnerToDelete.id);
      toast.success(`Deleted ${partnerToDelete.name}`);
      fetchPartners();
    } catch (err) {
      console.error('Failed to delete delivery partner', err);
      toast.error('Failed to delete delivery partner');
    } finally {
      setPartnerToDelete(null);
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone && p.phone.includes(searchQuery)) ||
    (p.vehicle_type && p.vehicle_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Delivery Partner Master Data</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage own riders & third-party delivery channels (Foodpanda, Pathao, UberEats)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={fetchPartners} variant="outline" size="sm" className="gap-1 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <PermissionGuard permission="restaurant_delivery_partners:create">
                  <Button onClick={handleOpenAddModal} className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl gap-1.5 shadow-md">
                              <Plus className="w-4 h-4" /> Add Delivery Partner
                            </Button>
                  </PermissionGuard>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search riders, phone numbers, vehicle..."
            className="pl-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total Partners: <span className="font-bold text-slate-900 dark:text-slate-100">{filteredPartners.length}</span>
        </div>
      </div>

      {/* Grid of Delivery Partners */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading Delivery Partners...</p>
        </div>
      ) : filteredPartners.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent text-center py-16">
          <CardContent className="space-y-3">
            <Bike className="w-12 h-12 mx-auto opacity-30 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Delivery Partners Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Add riders or 3rd-party delivery aggregators to assign them on POS delivery orders.</p>
            <PermissionGuard permission="restaurant_delivery_partners:create">
                          <Button onClick={handleOpenAddModal} className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl gap-1.5">
                                        <Plus className="w-4 h-4" /> Add Delivery Partner
                                      </Button>
                          </PermissionGuard>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPartners.map((partner) => (
            <Card key={partner.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    partner.type === 'THIRD_PARTY'
                      ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  }`}>
                    {partner.type === 'THIRD_PARTY' ? '3rd Party Aggregator' : 'In-House Rider'}
                  </span>
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                    {partner.name}
                  </CardTitle>
                </div>
                <span className={`flex items-center gap-1 text-[11px] font-bold ${partner.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {partner.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {partner.is_active ? 'Active' : 'Inactive'}
                </span>
              </CardHeader>

              <CardContent className="pt-3 space-y-2 text-xs">
                {partner.phone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>{partner.phone}</span>
                  </div>
                )}
                {partner.vehicle_type && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    <span>{partner.vehicle_type}</span>
                  </div>
                )}
                {partner.commission_pct !== undefined && partner.commission_pct !== null && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Percent className="w-3.5 h-3.5 text-amber-500" />
                    <span>Commission: {partner.commission_pct}%</span>
                  </div>
                )}
                {partner.notes && (
                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                    "{partner.notes}"
                  </p>
                )}

                <div className="pt-3 flex justify-end gap-1.5 border-t border-slate-100 dark:border-slate-800">
                  <PermissionGuard permission="restaurant_delivery_partners:update">
                          <Button onClick={() => handleOpenEditModal(partner)} variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1">
                                              <Edit className="w-3.5 h-3.5" /> Edit
                                            </Button>
                          </PermissionGuard>
                  <PermissionGuard permission="restaurant_delivery_partners:delete">
                          <Button onClick={() => setPartnerToDelete({ id: partner.id, name: partner.name })} variant="destructive" size="sm" className="h-8 text-xs rounded-xl gap-1">
                                              <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </Button>
                          </PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingPartner ? 'Edit Delivery Partner' : 'Add New Delivery Partner'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="font-bold">Partner / Rider Name *</Label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahim (Rider #102) or Foodpanda"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Partner Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs"
                  >
                    <option value="OWN_RIDER">In-House Rider</option>
                    <option value="THIRD_PARTY">3rd Party Aggregator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="font-bold">Vehicle Type</Label>
                  <Input
                    type="text"
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    placeholder="Motorcycle, Bicycle..."
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Phone Number</Label>
                  <Input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+8801700000000"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-bold">Commission % (if 3rd party)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.commission_pct}
                    onChange={(e) => setFormData({ ...formData, commission_pct: e.target.value })}
                    placeholder="15.0"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-bold">Notes / Description</Label>
                <Input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional delivery instructions or notes"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Active (available for selection on POS)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <PermissionGuard permission="restaurant_delivery_partners:create">
                              <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs">
                                                {editingPartner ? 'Save Changes' : 'Create Partner'}
                                              </Button>
                              </PermissionGuard>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!partnerToDelete}
        onClose={() => setPartnerToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Delivery Partner"
        description={`Are you sure you want to delete "${partnerToDelete?.name}"? This action cannot be undone.`}
        variant="destructive"
      />
    </div>
  );
}
