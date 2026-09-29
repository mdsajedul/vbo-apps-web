'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { restaurantApi } from '@/lib/restaurant-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { UtensilsCrossed, Plus, Minus, ShoppingBag, CheckCircle, Sparkles } from 'lucide-react';

export default function GuestQROrderPage() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId') || searchParams.get('table');

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Array<{ item: any; quantity: number }>>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        const items = await restaurantApi.getActiveMenuItems();
        setMenuItems(items || []);
      } catch (err) {
        toast.error('Failed to load restaurant menu');
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const handleAddToCart = (item: any) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.item.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean) as any);
  };

  const handlePlaceOrder = async () => {
    if (!tableId) {
      toast.error('Missing table identification in QR link');
      return;
    }
    if (cart.length === 0) return;

    try {
      // 1. Open session if not already open
      let session: any;
      try {
        session = await restaurantApi.openSession({
          table_id: tableId,
          guest_count: 1,
        });
      } catch (err) {
        // Session already open, fetch active sessions
        const active = await restaurantApi.getActiveSessions();
        session = active.find((s: any) => s.table_id === tableId || s.table?.id === tableId);
      }

      if (!session) {
        toast.error('Unable to establish table session');
        return;
      }

      // 2. Submit order to session
      await restaurantApi.addOrder(session.id, {
        notes: 'QR Guest Self-Order',
        items: cart.map(c => ({
          product_id: c.item.product_id,
          menu_item_id: c.item.id,
          product_name: c.item.product?.name || 'Item',
          quantity: c.quantity,
          unit_price: c.item.product?.base_price || 1000,
        })),
      });

      setSubmitted(true);
      toast.success('Your order has been sent to the kitchen!');
    } catch (err) {
      toast.error('Failed to submit order. Please contact waiter.');
    }
  };

  const cartTotalPaisa = cart.reduce((acc, c) => acc + (c.item.product?.base_price || 1000) * c.quantity, 0);

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-emerald-400 animate-bounce" />
        <h1 className="text-2xl font-bold">Order Received!</h1>
        <p className="text-sm text-slate-400 max-w-xs">
          Your order has been dispatched directly to the kitchen. Our chefs are preparing your meal now.
        </p>
        <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4 border-slate-700 text-white">
          Order Additional Items
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative pb-24 border-x border-slate-800 shadow-2xl">
      {/* Mobile Top Header */}
      <header className="p-4 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-xl">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base">Digital Menu</h1>
            <p className="text-[11px] text-blue-400 font-semibold">Table Guest Order</p>
          </div>
        </div>
        <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
          Live Order
        </span>
      </header>

      {/* Main Menu Feed */}
      <main className="p-4 space-y-4 flex-1">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm font-semibold">Loading digital menu...</div>
        ) : menuItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-blue-400 opacity-50" />
            <p className="text-sm font-bold">Menu is currently updating.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {menuItems.map((menuItem) => {
              const inCart = cart.find(c => c.item.id === menuItem.id);
              const pricePaisa = menuItem.product?.base_price || 1000;

              return (
                <Card key={menuItem.id} className="bg-slate-900 border-slate-800 text-slate-100 shadow-sm overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-sm text-slate-100">{menuItem.product?.name || 'Delicious Item'}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{menuItem.product?.description || 'Freshly prepared specialty dish'}</p>
                      <span className="text-sm font-extrabold text-blue-400 block pt-1">
                        ৳ {(pricePaisa / 100).toFixed(0)}
                      </span>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-1">
                        <button
                          onClick={() => handleQuantityChange(menuItem.id, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-700 rounded-lg text-slate-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm px-1">{inCart.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(menuItem.id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-blue-600 rounded-lg text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(menuItem)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-1 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 z-50">
          <Button
            onClick={handlePlaceOrder}
            className="w-full py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Send Order ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
            </div>
            <span>৳ {(cartTotalPaisa / 100).toFixed(0)}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
