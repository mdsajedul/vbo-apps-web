'use client';

import { useState, useEffect, useRef } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  ChefHat, Clock, AlertTriangle, CheckCircle2, RotateCcw, 
  Flame, Sparkles, Filter, X, Printer, Plus, Check, UtensilsCrossed 
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { cn } from '@/lib/utils';
import { PageLoader, Spinner } from '@/components/ui/spinner';

interface KitchenStation {
  id: string;
  name: string;
  display_name: string;
}

interface KitchenItem {
  id: string;
  product_name: string;
  quantity: string;
  status: 'NEW' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'VOIDED';
  special_instructions?: string;
  modifiers_text?: string;
}

interface KitchenOrder {
  id: string;
  table_number: string;
  order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'DRIVE_THROUGH';
  is_rush: boolean;
  created_at: string;
  kitchen_items: KitchenItem[];
}

export default function KitchenKDSPage() {
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Recall tracking
  const [lastBumpedItem, setLastBumpedItem] = useState<{ orderId: string; itemId: string } | null>(null);

  // Poll for current time to keep timers accurate
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch stations list
  useEffect(() => {
    async function loadStations() {
      try {
        const res = await restaurantApi.getKitchenStations();
        const stationList = Array.isArray(res) ? res : [];
        setStations(stationList);
        if (stationList.length > 0) {
          setSelectedStationId(stationList[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        toast.error('Failed to load kitchen stations');
        setLoading(false);
      }
    }
    loadStations();
  }, []);

  // Poll for active orders when station changes
  useEffect(() => {
    if (!selectedStationId) {
      setLoading(false);
      return;
    }
    loadOrders();
    const pollTimer = setInterval(loadOrders, 5000); // poll every 5s
    return () => clearInterval(pollTimer);
  }, [selectedStationId]);

  const prevOrderCountRef = useRef<number>(0);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio context blocked until interaction
    }
  };

  async function loadOrders() {
    try {
      const res = await restaurantApi.getKDSOrders(selectedStationId);
      const activeOrders = res.filter((order: KitchenOrder) => 
        order.kitchen_items.some((item) => item.status === 'NEW' || item.status === 'IN_PROGRESS')
      );

      if (activeOrders.length > prevOrderCountRef.current && prevOrderCountRef.current !== 0) {
        playChime();
        toast.info('🔔 New kitchen ticket arrived!');
      }
      prevOrderCountRef.current = activeOrders.length;
      setOrders(activeOrders);
    } catch (err) {
      console.error('Failed to fetch KDS orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleBumpItem = async (orderId: string, itemId: string) => {
    try {
      await restaurantApi.bumpKDSItem(orderId, itemId);
      setLastBumpedItem({ orderId, itemId });
      toast.success('Item completed');
      loadOrders();
    } catch (err) {
      toast.error('Failed to bump item');
    }
  };

  const handleRecallItem = async () => {
    if (!lastBumpedItem) return;
    try {
      await restaurantApi.recallKDSItem(lastBumpedItem.orderId, lastBumpedItem.itemId);
      toast.success('Last item recalled');
      setLastBumpedItem(null);
      loadOrders();
    } catch (err) {
      toast.error('Failed to recall item');
    }
  };

  const handleToggleRush = async (orderId: string, currentRush: boolean) => {
    try {
      await restaurantApi.markOrderRush(orderId, !currentRush);
      toast.success(currentRush ? 'Rush flag removed' : 'Order marked as RUSH!');
      loadOrders();
    } catch (err) {
      toast.error('Failed to toggle rush status');
    }
  };

  const handleBumpWholeOrder = async (order: KitchenOrder) => {
    try {
      const pendingItems = order.kitchen_items.filter(i => i.status === 'NEW' || i.status === 'IN_PROGRESS');
      await Promise.all(
        pendingItems.map(item => restaurantApi.bumpKDSItem(order.id, item.id))
      );
      toast.success('Entire order completed');
      loadOrders();
    } catch (err) {
      toast.error('Failed to complete order');
    }
  };

  // Helper to calculate elapsed time and status color
  const getOrderTimerInfo = (createdAt: string) => {
    const elapsedMs = currentTime.getTime() - new Date(createdAt).getTime();
    const elapsedMins = Math.floor(elapsedMs / 1000 / 60);
    const elapsedSecs = Math.floor((elapsedMs / 1000) % 60);

    let textColor = 'text-emerald-600 dark:text-emerald-400';
    let bgColor = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20';

    if (elapsedMins >= 20) {
      textColor = 'text-rose-600 dark:text-rose-400 animate-pulse font-bold';
      bgColor = 'bg-rose-50 dark:bg-rose-500/10 border-rose-200/50 dark:border-rose-500/20';
    } else if (elapsedMins >= 10) {
      textColor = 'text-amber-600 dark:text-amber-400 font-bold';
      bgColor = 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20';
    }

    return {
      minutes: elapsedMins,
      seconds: elapsedSecs,
      textColor,
      bgColor,
    };
  };

  // State for Add Station Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationPrinterIp, setNewStationPrinterIp] = useState('');
  const [isSubmittingStation, setIsSubmittingStation] = useState(false);

  const handleCreateStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) return;

    setIsSubmittingStation(true);
    try {
      const newSt = await restaurantApi.createKitchenStation({
        name: newStationName.trim().toLowerCase().replace(/\s+/g, '-'),
        display_name: newStationName.trim(),
        category_routing_json: JSON.stringify([]),
      });
      toast.success(`Kitchen Station "${newStationName}" created successfully!`);
      const res = await restaurantApi.getKitchenStations();
      const list = Array.isArray(res) ? res : [];
      setStations(list);
      setSelectedStationId(newSt.id || (list.length > 0 ? list[0].id : ''));
      setNewStationName('');
      setNewStationPrinterIp('');
      setIsAddModalOpen(false);
    } catch (err) {
      toast.error('Failed to create kitchen station');
    } finally {
      setIsSubmittingStation(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Kitchen display system (KDS)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live preparation line, station routing, and ticket bump tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Station selector */}
          <div className="relative">
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="h-10 pl-3 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              {stations.length === 0 ? (
                <option value="">No Stations Created Yet</option>
              ) : (
                stations.map(st => (
                  <option key={st.id} value={st.id}>{st.display_name || st.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Quick Add Station Button */}
          <PermissionGuard permission="restaurant_kitchen:create">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add station</span>
            </Button>
          </PermissionGuard>

          {/* Recall Button */}
          {lastBumpedItem && (
            <Button
              variant="outline"
              onClick={handleRecallItem}
              className="rounded-xl text-xs font-semibold h-10 px-3.5 border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recall bump</span>
            </Button>
          )}

          {/* Active Orders Count Badge */}
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700 font-mono">
            {orders.length} Active Tickets
          </span>
        </div>
      </div>

      {/* Live Order cards */}
      {loading ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-16 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
          <span className="text-xs text-slate-500">Connecting to station stream...</span>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-200/50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">All preparation clear!</h3>
          <p className="text-xs text-slate-400 mt-1">No pending food or beverage tickets assigned to this station.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const timer = getOrderTimerInfo(order.created_at);
            
            return (
              <Card 
                key={order.id} 
                className={cn(
                  "rounded-2xl border bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between overflow-hidden transition-all",
                  order.is_rush 
                    ? "border-rose-500 ring-2 ring-rose-500/20" 
                    : "border-slate-200/80 dark:border-slate-800"
                )}
              >
                {/* Card Header */}
                <div className={cn(
                  "px-5 py-3.5 border-b flex items-start justify-between",
                  order.is_rush 
                    ? "bg-rose-50/80 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" 
                    : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
                )}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        {order.order_type === 'DINE_IN' ? `Table ${order.table_number}` : order.order_type === 'DELIVERY' ? 'Delivery Order' : 'Takeaway'}
                      </span>
                      {order.is_rush && (
                        <span className="bg-rose-600 text-[10px] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                          <Flame className="w-2.5 h-2.5 fill-white" /> RUSH
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider font-semibold">
                      {order.order_type}
                    </span>
                  </div>

                  {/* Timer widget */}
                  <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-mono font-bold", timer.bgColor, timer.textColor)}>
                    <Clock className="w-3 h-3" />
                    <span>{String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Items List */}
                <CardContent className="p-5 space-y-3 flex-1 overflow-y-auto max-h-72">
                  {order.kitchen_items.map((item) => {
                    const isCompleted = item.status === 'READY' || item.status === 'SERVED';
                    
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => !isCompleted && handleBumpItem(order.id, item.id)}
                        className={cn(
                          "flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 last:border-0 pb-2.5 last:pb-0 cursor-pointer group select-none",
                          isCompleted ? "opacity-35 line-through" : ""
                        )}
                      >
                        <div className="flex-1 space-y-1 pr-2">
                          <div className="flex items-start gap-2">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                              {Number(item.quantity).toFixed(0)}x
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.product_name}
                            </span>
                          </div>
                          {item.modifiers_text && (
                            <p className="text-[11px] text-slate-400 pl-8">
                              + {item.modifiers_text}
                            </p>
                          )}
                          {item.special_instructions && (
                            <p className="text-[11px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md ml-8 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {item.special_instructions}
                            </p>
                          )}
                        </div>

                        {/* Status Checkbox */}
                        <div className="pt-0.5">
                          <div className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                            isCompleted 
                              ? "bg-emerald-600 border-emerald-600 text-white" 
                              : "border-slate-300 dark:border-slate-700 group-hover:border-slate-900 dark:group-hover:border-white"
                          )}>
                            {isCompleted && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                {/* Footer Controls */}
                <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleToggleRush(order.id, order.is_rush)}
                    className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold h-8"
                  >
                    <Flame className="w-3 h-3 mr-1" /> {order.is_rush ? 'Un-Rush' : 'Rush'}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleBumpWholeOrder(order)}
                    className="flex-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold h-8 shadow-xs flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal for Creating Kitchen Station */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <ChefHat className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Create kitchen station
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure ticket station name and thermal printer endpoint.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateStationSubmit}>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Station Display Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  placeholder="e.g. Hot Kitchen / Grill Line"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-slate-400" /> Thermal Printer IP Endpoint (Optional)
                </Label>
                <Input
                  value={newStationPrinterIp}
                  onChange={(e) => setNewStationPrinterIp(e.target.value)}
                  placeholder="192.168.1.200:9100"
                  className="rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <PermissionGuard permission="restaurant_kitchen:create">
                <Button
                  type="submit"
                  disabled={isSubmittingStation}
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSubmittingStation ? 'Saving...' : 'Create station'}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
