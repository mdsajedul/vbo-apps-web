'use client';

import React, { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import { X, Truck, User, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deliveryData: {
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    delivery_driver?: string;
    notes?: string;
  }) => void;
  initialData?: {
    customer_name?: string;
    customer_phone?: string;
    delivery_address?: string;
    delivery_driver?: string;
    notes?: string;
  };
}

export function DeliveryInfoModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
}: DeliveryInfoModalProps) {
  const [customerName, setCustomerName] = useState(initialData?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(initialData?.delivery_address || '');
  const [deliveryDriver, setDeliveryDriver] = useState(initialData?.delivery_driver || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [partners, setPartners] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingPartners(true);
      restaurantApi
        .getDeliveryPartners()
        .then((data) => {
          const activeList = Array.isArray(data) ? data.filter((p: any) => p.is_active !== false) : [];
          setPartners(activeList);
          if (activeList.length > 0 && !deliveryDriver) {
            setDeliveryDriver(activeList[0].name);
          }
        })
        .catch((err) => {
          console.error('Failed to load delivery partners', err);
        })
        .finally(() => setLoadingPartners(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Customer name is required for delivery.');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Customer phone number is required for delivery.');
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error('Delivery address is required.');
      return;
    }

    onConfirm({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      delivery_address: deliveryAddress.trim(),
      delivery_driver: deliveryDriver,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-stone-900 dark:text-slate-100 space-y-5 z-10 transition-colors duration-200">
        <div className="flex justify-between items-center border-b border-stone-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-[#006c49] dark:text-[#4edea3]" />
            <h3 className="font-extrabold text-base text-stone-900 dark:text-white">Delivery Order Details</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-200 dark:hover:bg-slate-800 rounded-xl text-stone-400 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#006c49] dark:text-[#4edea3]" /> Customer Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Tanvir Hossain"
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#006c49] dark:text-[#4edea3]" /> Phone Number *
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +8801712345678"
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#006c49] dark:text-[#4edea3]" /> Full Delivery Address *
            </label>
            <textarea
              required
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="House 42, Road 11, Banani, Dhaka"
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 resize-none font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#006c49] dark:text-[#4edea3]" /> Delivery Partner / Rider
            </label>
            {loadingPartners ? (
              <div className="text-[11px] text-stone-500 dark:text-slate-500 animate-pulse">Loading delivery partners...</div>
            ) : partners.length > 0 ? (
              <select
                value={deliveryDriver}
                onChange={(e) => setDeliveryDriver(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 font-semibold"
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.name} className="bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200">
                    {p.name} ({p.type === 'THIRD_PARTY' ? '3rd Party' : 'Rider'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={deliveryDriver}
                onChange={(e) => setDeliveryDriver(e.target.value)}
                placeholder="Rider name or Foodpanda/UberEats"
                className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 font-semibold"
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700 dark:text-slate-300">Delivery Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call before arrival, gate pass info..."
              className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 font-semibold"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#006c49] hover:bg-[#005a3d] text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-white" /> Save Delivery Info
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
