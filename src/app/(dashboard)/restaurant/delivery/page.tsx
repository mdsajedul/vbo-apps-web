'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Bike, Clock, CheckCircle2, MapPin, User, RefreshCw } from 'lucide-react';
import { restaurantApi } from '@/lib/restaurant-api';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

interface DeliveryOrder {
  id: string;
  aggregator: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  driverName?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalPaisa: number;
  status: string;
  createdAt: string;
  sessionId: string;
}

export default function RestaurantDeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await restaurantApi.getOrders({ type: 'DELIVERY' });
      // Map TableSessionOrder to DeliveryOrder
      const mapped: DeliveryOrder[] = res.map((o: any) => ({
        id: o.id,
        sessionId: o.session_id,
        aggregator: o.aggregator || 'DIRECT_WEB',
        orderNumber: o.order_number,
        customerName: o.customer_name || 'Walk-in Customer',
        customerPhone: o.customer_phone || '',
        deliveryAddress: o.delivery_address || 'No Address Provided',
        driverName: o.driver_name || '',
        items: o.order_items.map((i: any) => ({ name: i.product_name, quantity: i.quantity, price: i.line_total / i.quantity })),
        totalPaisa: o.order_items.reduce((sum: number, i: any) => sum + i.line_total, 0),
        status: o.session?.status || 'OPEN',
        createdAt: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      setOrders(mapped);
    } catch (e) {
      toast.error('Failed to load delivery orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, sessionId: string, nextStatus: string) => {
    try {
      // In a real system, you might have specific status enums for delivery orders.
      // Here we will just close the session if DELIVERED, or just toast for others.
      if (nextStatus === 'DELIVERED') {
        await restaurantApi.updateTableStatus(sessionId, 'CLOSED');
      }
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      toast.success(`Order status updated to ${nextStatus}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <Bike className="w-8 h-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Delivery Aggregators Hub</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Live order dispatch console for Foodpanda, UberEats & Web Delivery</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Aggregator Sync Active
          </span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {orders.map((order) => {
          let badgeColor = 'bg-pink-500/10 text-pink-600 border-pink-500/20';
          if (order.aggregator === 'UBEREATS') badgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
          if (order.aggregator === 'DELIVEROO') badgeColor = 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';

          return (
            <Card key={order.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <div>
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeColor}`}>
                      {order.aggregator}
                    </span>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{order.orderNumber}</CardTitle>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {order.createdAt}
                  </span>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" /> {order.customerName} ({order.customerPhone})
                    </p>
                    <p className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {order.deliveryAddress}
                    </p>
                    {order.driverName && (
                      <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                        <Bike className="w-3.5 h-3.5" /> Driver: {order.driverName}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ordered Items</Label>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>{item.quantity}x {item.name}</span>
                        <span>৳ {((item.price * item.quantity) / 100).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                      <span>Total</span>
                      <span>৳ {(order.totalPaisa / 100).toFixed(0)}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                {order.status === 'OPEN' && (
                  <PermissionGuard permission="restaurant_delivery_partners:update">
                          <Button onClick={() => handleUpdateStatus(order.id, order.sessionId, 'PREPARING')} className="w-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700">
                                              Accept & Prepare
                                            </Button>
                          </PermissionGuard>
                )}
                {order.status === 'PREPARING' && (
                  <PermissionGuard permission="restaurant_delivery_partners:update">
                          <Button onClick={() => handleUpdateStatus(order.id, order.sessionId, 'DISPATCHED')} className="w-full bg-amber-600 text-white font-bold text-xs hover:bg-amber-700">
                                              Hand to Driver
                                            </Button>
                          </PermissionGuard>
                )}
                {order.status === 'DISPATCHED' && (
                  <PermissionGuard permission="restaurant_delivery_partners:update">
                          <Button onClick={() => handleUpdateStatus(order.id, order.sessionId, 'DELIVERED')} className="w-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700">
                                              Mark Delivered
                                            </Button>
                          </PermissionGuard>
                )}
                {order.status === 'DELIVERED' && (
                  <div className="w-full py-1.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Delivered & Completed
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
