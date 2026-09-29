'use client';

import React, { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import {
  Clock, UtensilsCrossed, ShoppingBag, Truck, ChefHat, CheckCircle2,
  RefreshCw, DollarSign, Filter, Search, User, MapPin, Eye, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ActiveOrdersTabProps {
  onRecallSession?: (session: any) => void;
  onSettleSession?: (session: any) => void;
}

export function ActiveOrdersTab({ onRecallSession, onSettleSession }: ActiveOrdersTabProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActiveOrdersData = async () => {
    setLoading(true);
    try {
      const [sessionsData, ordersData] = await Promise.all([
        restaurantApi.getActiveSessions().catch(() => []),
        restaurantApi.getOrders().catch(() => []),
      ]);

      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      console.error('Failed to load active orders', err);
      toast.error('Failed to refresh active orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrdersData();
    const interval = setInterval(fetchActiveOrdersData, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Consolidate dine-in table sessions and takeaway/delivery orders
  const consolidatedList: Array<{
    id: string;
    type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    number: string;
    customer_name?: string;
    customer_phone?: string;
    driver_name?: string;
    items_count: number;
    total_amount_bdt: number;
    is_settled: boolean;
    opened_at: string;
    raw_data: any;
  }> = [];

  // Add Dine-In Sessions
  sessions.forEach((s) => {
    // Skip virtual takeaway / delivery tables so they aren't rendered as fake Dine-In cards
    if (s.table?.table_number === 'TAKEAWAY' || s.table?.table_number === 'DELIVERY' || s.table?.name?.includes('TAKEAWAY') || s.table?.name?.includes('DELIVERY')) {
      return;
    }
    const tableNumber = s.table ? (s.table.name || `Table ${s.table.table_number}`) : 'Table Session';
    let totalPaisa = 0;
    let itemCount = 0;

    s.orders?.forEach((o: any) => {
      o.order_items?.forEach((i: any) => {
        if (!i.is_void) {
          totalPaisa += Number(i.line_total || (i.unit_price * i.quantity));
          itemCount += Number(i.quantity);
        }
      });
    });

    consolidatedList.push({
      id: s.id,
      type: 'DINE_IN',
      number: tableNumber,
      customer_name: s.customer?.name || `Guest (${s.guest_count || 1})`,
      customer_phone: s.customer?.phone,
      items_count: itemCount,
      total_amount_bdt: totalPaisa / 100,
      is_settled: s.status === 'SETTLED',
      opened_at: s.opened_at || s.created_at,
      raw_data: s,
    });
  });

  // Add Takeaway & Delivery Orders from tableSessionOrder
  orders.forEach((o) => {
    // Avoid duplication if order is linked to a dine-in session already rendered above
    const isAlreadyInDineIn = sessions.some((s) => s.id === o.session_id && o.order_type === 'DINE_IN');
    if (isAlreadyInDineIn) return;

    // Filter out settled orders
    if (o.session?.status === 'SETTLED') return;

    let totalPaisa = 0;
    let itemCount = 0;

    o.order_items?.forEach((i: any) => {
      if (!i.is_void) {
        totalPaisa += Number(i.line_total || (i.unit_price * i.quantity));
        itemCount += Number(i.quantity);
      }
    });

    const isTakeaway = o.order_type === 'TAKEAWAY';
    const isDelivery = o.order_type === 'DELIVERY';

    // Parse notes for driver/customer info if set
    let parsedCustomer = 'Guest';
    let parsedPhone = '';
    let parsedDriver = '';

    if (o.notes) {
      if (o.notes.includes('Takeaway for ')) {
        const match = o.notes.match(/Takeaway for (.*?) \((.*?)\)/);
        if (match) {
          parsedCustomer = match[1];
          parsedPhone = match[2];
        }
      } else if (o.notes.includes('Delivery for ')) {
        const match = o.notes.match(/Delivery for (.*?) \((.*?)\)/);
        if (match) {
          parsedCustomer = match[1];
          parsedPhone = match[2];
        }
      }
    }

    consolidatedList.push({
      id: o.id,
      type: o.order_type as any,
      number: o.order_number || `#${o.id.substring(0, 6)}`,
      customer_name: parsedCustomer,
      customer_phone: parsedPhone,
      driver_name: parsedDriver,
      items_count: itemCount,
      total_amount_bdt: totalPaisa / 100,
      is_settled: o.session?.status === 'SETTLED',
      opened_at: o.created_at,
      raw_data: o,
    });
  });

  // Filter list
  const filteredList = consolidatedList.filter((item) => {
    const matchesFilter = filterType === 'ALL' || item.type === filterType;
    const matchesSearch =
      item.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customer_name && item.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.customer_phone && item.customer_phone.includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return { label: '🍽 Dine-In', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'TAKEAWAY':
        return { label: '📦 Takeaway', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'DELIVERY':
        return { label: '🚚 Delivery', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      default:
        return { label: type, color: 'bg-slate-800 text-slate-300' };
    }
  };

  const getElapsedTime = (isoDateString: string) => {
    if (!isoDateString) return 'Just now';
    const diffMs = Date.now() - new Date(isoDateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-stone-100 dark:bg-slate-950 space-y-6 transition-colors duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <span>Live Active Orders & Sessions</span>
            <span className="text-xs bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono px-2.5 py-0.5 rounded-full">
              {consolidatedList.length} Active
            </span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">Track order statuses across Dine-In tables, Counter Takeaway, and Home Deliveries in real-time.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchActiveOrdersData}
            className="p-2 bg-stone-200/80 hover:bg-stone-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-stone-700 dark:text-slate-300 border border-stone-300/60 dark:border-transparent transition-colors flex items-center gap-1.5 text-xs font-bold px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        {/* Search Box */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, phone..."
            className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {(['ALL', 'DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === t ? 'bg-amber-600 text-white font-extrabold shadow-md' : 'bg-stone-200/80 dark:bg-slate-800 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {t === 'ALL' ? `All Orders (${consolidatedList.length})` : t === 'DINE_IN' ? '🍽 Dine-In' : t === 'TAKEAWAY' ? '📦 Takeaway' : '🚚 Delivery'}
            </button>
          ))}
        </div>
      </div>

      {/* Active Orders Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-500 dark:text-slate-500 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
          <p className="text-xs font-semibold">Loading Live Active Orders...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-20 text-center text-stone-500 dark:text-slate-500 space-y-3 bg-white/70 dark:bg-slate-900/40 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <ChefHat className="w-12 h-12 mx-auto opacity-30 text-amber-500" />
          <h3 className="text-sm font-bold text-stone-700 dark:text-slate-300">No Active Orders Found</h3>
          <p className="text-xs max-w-sm mx-auto text-stone-500 dark:text-slate-500">
            {filterType === 'ALL' ? 'Start a new dining session or takeaway order from the Items menu.' : `No live active orders under ${filterType}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredList.map((item) => {
            const badge = getTypeBadge(item.type);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/50 transition-all shadow-md hover:shadow-lg dark:shadow-lg group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <h3 className="font-extrabold text-base text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mt-1">
                        {item.number}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" /> {getElapsedTime(item.opened_at)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs pt-1 border-t border-stone-200 dark:border-slate-800">
                    <p className="text-stone-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" /> {item.customer_name || 'Guest'}
                    </p>
                    {item.customer_phone && (
                      <p className="text-stone-500 dark:text-slate-400 font-mono text-[11px] pl-5">
                        📞 {item.customer_phone}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-stone-500 dark:text-slate-400 pt-1 text-[11px]">
                      <span>Items: <strong className="text-stone-800 dark:text-slate-200">{item.items_count} dish(es)</strong></span>
                      <span className={`font-mono font-bold ${item.is_settled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {item.is_settled ? '✅ Paid' : '⏳ Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-slate-500 block uppercase font-bold">Total</span>
                    <span className="font-mono font-extrabold text-sm text-stone-900 dark:text-white">৳ {item.total_amount_bdt.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-1.5">
                    {onRecallSession && (
                      <button
                        onClick={() => onRecallSession(item.raw_data)}
                        className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        title="Open in ticket sidebar"
                      >
                        <Eye className="w-3.5 h-3.5" /> Open Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
