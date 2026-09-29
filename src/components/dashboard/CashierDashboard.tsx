'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { posApi, branchesApi } from '@/lib/api';
import {
  CreditCard,
  ShoppingBag,
  DollarSign,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Receipt,
  Store,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export function CashierDashboard() {
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<any>(null);

  const loadShift = async () => {
    try {
      const branchesRes = await branchesApi.getAll().catch(() => []);
      const branches = Array.isArray(branchesRes?.data) ? branchesRes.data : Array.isArray(branchesRes) ? branchesRes : [];
      const branchId = branches[0]?.id;
      const res = await posApi.getCurrentShift(branchId);
      setShift(res);
    } catch (err) {
      console.error('Failed to load cashier shift info', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShift();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Cashier Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-15">
          <CreditCard className="h-64 w-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-emerald-100">
              <Sparkles className="w-3.5 h-3.5" />
              Front of House Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Cashier &amp; POS Command Hub
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl">
              Shift float status, fast checkout launcher, and receipt management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pos"
              className="px-6 py-3 rounded-xl bg-white text-emerald-950 font-bold text-sm shadow-xl hover:bg-emerald-50 hover:scale-[1.02] transition-all flex items-center gap-2 group"
            >
              <Store className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              Launch POS Checkout
              <ExternalLink className="w-4 h-4 text-emerald-600 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Shift Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Shift Status
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {shift ? 'Open Shift Active' : 'No Open Shift'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {shift ? `Started at: ${new Date(shift.opened_at || shift.created_at).toLocaleTimeString()}` : 'Open a shift to start ringing sales'}
          </p>
        </div>

        {/* Starting Cash */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Drawer Float
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ৳ {shift?.starting_cash ? ((shift.starting_cash / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })) : '0.00'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Opening cash declared in drawer
          </p>
        </div>

        {/* Quick Launch Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ready to Sell
              </span>
              <Receipt className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Direct Counter Terminal
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Barcode scan, table checkout, or MFS cash collection
            </p>
          </div>

          <Link
            href="/pos"
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            Open POS Register <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
