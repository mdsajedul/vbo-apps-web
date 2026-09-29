'use client';

import { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import { branchesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Calendar, Clock, User, Users, Plus, CheckCircle, 
  XCircle, Bell, Navigation, Phone, MessageSquare, 
  AlertCircle, Check, X, Search 
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { cn } from '@/lib/utils';
import { PageLoader, Spinner } from '@/components/ui/spinner';

interface Branch {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  customer?: {
    full_name: string;
    phone: string;
  };
  date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  status: 'CONFIRMED' | 'SEATED' | 'NO_SHOW' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  table: {
    table_number: string;
  };
}

interface WaitlistEntry {
  id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  status: 'WAITING' | 'NOTIFIED' | 'SEATED' | 'LEFT';
  estimated_wait_minutes: number;
  notes?: string;
  created_at: string;
}

export default function ReservationsWaitlistPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  // Reservations list for the selected date
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  // New Reservation Form
  const [partySize, setPartySize] = useState<number>(2);
  const [resStartTime, setResStartTime] = useState<'12:00' | '13:00' | '14:00' | '18:00' | '19:00' | '20:00' | '21:00' | string>('19:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false);

  // New Waitlist Form
  const [waitName, setWaitName] = useState('');
  const [waitPhone, setWaitPhone] = useState('');
  const [waitPartySize, setWaitPartySize] = useState<number>(2);
  const [waitMins, setWaitMins] = useState<number>(20);
  const [waitNotes, setWaitNotes] = useState('');

  // Fetch branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await branchesApi.getAll();
        const branchList = Array.isArray(res) ? res : res?.data || [];
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        toast.error('Failed to load branches');
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  // Reload data when branch or date changes
  useEffect(() => {
    if (!selectedBranchId) {
      setLoading(false);
      return;
    }
    loadReservationsAndWaitlist();
  }, [selectedBranchId, selectedDate]);

  async function loadReservationsAndWaitlist() {
    setLoading(true);
    try {
      const [resList, waitList] = await Promise.all([
        restaurantApi.getReservations(selectedDate),
        restaurantApi.getWaitlist()
      ]);
      setReservations(resList || []);
      setWaitlist(waitList || []);
    } catch (err) {
      toast.error('Failed to load reservations data');
    } finally {
      setLoading(false);
    }
  }

  const handleCheckAvailability = async () => {
    setCheckingAvailability(true);
    try {
      const res = await restaurantApi.checkReservationAvailability(selectedDate, partySize);
      setAvailableTables(res || []);
      if (res.length > 0) {
        setSelectedTableId(res[0].id);
        toast.success(`${res.length} tables available for party of ${partySize}!`);
      } else {
        setSelectedTableId('');
        toast.warning('No tables available for this capacity');
      }
    } catch (err) {
      toast.error('Availability check failed');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCreateReservation = async () => {
    if (!selectedBranchId || !selectedTableId || !customerName.trim() || !customerPhone.trim()) {
      toast.error('Please check availability and fill in customer details');
      return;
    }
    try {
      const [hour, min] = resStartTime.split(':').map(Number);
      const endHour = String((hour + 2) % 24).padStart(2, '0');
      const resEndTime = `${endHour}:${String(min).padStart(2, '0')}`;

      await restaurantApi.createReservation({
        branch_id: selectedBranchId,
        table_id: selectedTableId,
        date: new Date(selectedDate).toISOString(),
        start_time: resStartTime,
        end_time: resEndTime,
        party_size: partySize,
        notes: resNotes || undefined,
        customer_name: customerName,
        customer_phone: customerPhone
      });

      toast.success('Reservation booked successfully!');
      setIsReservationModalOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setResNotes('');
      setAvailableTables([]);
      setSelectedTableId('');
      loadReservationsAndWaitlist();
    } catch (err) {
      toast.error('Failed to book reservation');
    }
  };

  const handleUpdateResStatus = async (id: string, status: string) => {
    try {
      await restaurantApi.updateReservationStatus(id, status);
      toast.success(`Reservation marked as ${status}`);
      loadReservationsAndWaitlist();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddToWaitlist = async () => {
    if (!selectedBranchId || !waitName.trim() || !waitPhone.trim()) {
      toast.error('Name and Phone are required');
      return;
    }
    try {
      await restaurantApi.addToWaitlist({
        branch_id: selectedBranchId,
        customer_name: waitName,
        customer_phone: waitPhone,
        party_size: waitPartySize,
        estimated_wait_minutes: waitMins,
        notes: waitNotes || undefined
      });
      toast.success('Guest added to waitlist queue');
      setIsWaitlistModalOpen(false);
      setWaitName('');
      setWaitPhone('');
      setWaitNotes('');
      loadReservationsAndWaitlist();
    } catch (err) {
      toast.error('Failed to add to waitlist');
    }
  };

  const handleNotifyWaitlist = async (id: string) => {
    try {
      await restaurantApi.notifyWaitlist(id);
      toast.success('Guest notified via SMS alert!');
      loadReservationsAndWaitlist();
    } catch (err) {
      toast.error('Failed to notify guest');
    }
  };

  const handleSeatWaitlist = async (id: string) => {
    try {
      const floorPlansRes = await restaurantApi.getFloorPlans(selectedBranchId);
      const allTables = floorPlansRes.flatMap((fp: any) => 
        fp.dining_zones?.flatMap((z: any) => z.tables || []) || []
      );
      const available = allTables.filter((t: any) => t.status === 'AVAILABLE');

      if (available.length === 0) {
        toast.error('No tables are currently available to seat this guest');
        return;
      }

      const targetTable = available[0];
      await restaurantApi.seatWaitlist(id, targetTable.id);
      toast.success(`Guest seated at Table T-${targetTable.table_number}!`);
      loadReservationsAndWaitlist();
    } catch (err) {
      toast.error('Failed to seat guest');
    }
  };

  const getWaitTimeElapsed = (createdAtStr: string) => {
    const elapsedMs = new Date().getTime() - new Date(createdAtStr).getTime();
    return Math.max(0, Math.floor(elapsedMs / 1000 / 60));
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Reservations & waitlist
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage guest table bookings, walk-in wait queues, and SMS notification alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Branch Select */}
          <div className="relative">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-10 pl-3 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
          </div>

          <PermissionGuard permission="restaurant_reservations:create">
            <Button
              onClick={() => setIsReservationModalOpen(true)}
              className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book table</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Booked Reservations Table (Col-span 8) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reservations Directory</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bookings for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700 font-mono">
                {reservations.length} Booked
              </span>
            </div>

            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Spinner className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
                  <span className="text-xs">Loading reservation bookings...</span>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-medium">No reservations scheduled for this date.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations.map((res) => {
                    const isSeated = res.status === 'SEATED';
                    const isCancelled = res.status === 'CANCELLED';
                    
                    return (
                      <div 
                        key={res.id} 
                        className={cn(
                          "border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
                          isSeated 
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40" 
                            : isCancelled 
                            ? "opacity-50 border-slate-200 dark:border-slate-800" 
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                        )}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 border border-slate-200/60 dark:border-slate-700">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {res.customer?.full_name || res.customer_name || 'Guest'}
                              </p>
                              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold font-mono border border-slate-200/60 dark:border-slate-700">
                                <Users className="w-3 h-3" /> {res.party_size} Pax
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1 font-mono font-medium">
                                <Clock className="w-3 h-3 text-slate-400" /> {res.start_time} - {res.end_time}
                              </span>
                              <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                                Table T-{res.table?.table_number}
                              </span>
                              {res.customer_phone && (
                                <span className="flex items-center gap-1 font-mono text-slate-400">
                                  <Phone className="w-3 h-3" /> {res.customer_phone}
                                </span>
                              )}
                            </div>
                            {res.notes && (
                              <p className="text-[11px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-md py-0.5 px-2 mt-2">
                                <span className="font-bold">Note:</span> {res.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status controls */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          {res.status === 'CONFIRMED' && (
                            <>
                              <PermissionGuard permission="restaurant_reservations:update">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleUpdateResStatus(res.id, 'SEATED')}
                                  className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 shadow-xs flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Seat
                                </Button>
                              </PermissionGuard>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUpdateResStatus(res.id, 'CANCELLED')}
                                className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 dark:border-rose-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 px-3"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border font-mono",
                            res.status === 'SEATED' ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50" :
                            res.status === 'CANCELLED' ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50" :
                            "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200/50"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", res.status === 'SEATED' ? "bg-emerald-500" : res.status === 'CANCELLED' ? "bg-rose-500" : "bg-blue-500")}></span>
                            {res.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Waitlist Queue (Col-span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Waitlist Queue</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live walk-in guest lineup</p>
              </div>
              <PermissionGuard permission="restaurant_reservations:create">
                <Button 
                  size="sm" 
                  onClick={() => setIsWaitlistModalOpen(true)} 
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add guest
                </Button>
              </PermissionGuard>
            </div>

            <CardContent className="p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <Spinner className="w-6 h-6 text-slate-900 dark:text-white mb-2" />
                  <span className="text-xs">Loading waitlist...</span>
                </div>
              ) : waitlist.filter(w => w.status === 'WAITING' || w.status === 'NOTIFIED').length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-medium">Waitlist queue is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {waitlist
                    .filter(w => w.status === 'WAITING' || w.status === 'NOTIFIED')
                    .map((item) => {
                      const elapsed = getWaitTimeElapsed(item.created_at);
                      const isNotified = item.status === 'NOTIFIED';
                      
                      return (
                        <div 
                          key={item.id} 
                          className={cn(
                            "border rounded-xl p-3.5 space-y-3 transition-all",
                            isNotified 
                              ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40" 
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white">{item.customer_name}</p>
                              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" /> {item.customer_phone}
                              </p>
                            </div>
                            <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200/60 dark:border-slate-700">
                              <Users className="w-3 h-3 text-slate-400" /> {item.party_size} Pax
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" /> 
                              Wait: <strong className="text-slate-800 dark:text-slate-200">{elapsed}m</strong> / {item.estimated_wait_minutes}m
                            </span>
                            <span className={cn(
                              "text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border",
                              isNotified 
                                ? "text-amber-600 bg-amber-50 border-amber-200 dark:border-amber-900/40" 
                                : "text-blue-600 bg-blue-50 border-blue-200 dark:border-blue-900/40"
                            )}>
                              {item.status}
                            </span>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 py-1 px-2 rounded-md text-slate-500">
                              {item.notes}
                            </p>
                          )}

                          <div className="flex gap-2 pt-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleNotifyWaitlist(item.id)}
                              className="flex-1 text-xs font-semibold rounded-xl border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 h-8 gap-1"
                            >
                              <Bell className="w-3.5 h-3.5" /> SMS Alert
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleSeatWaitlist(item.id)}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-8 gap-1 shadow-xs"
                            >
                              <Navigation className="w-3.5 h-3.5" /> Seat Table
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* New Reservation Modal */}
      <Dialog open={isReservationModalOpen} onOpenChange={setIsReservationModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Book table reservation
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check table capacity and assign guest booking.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Step 1: Availability */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">1. Check Table Availability</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Party Size (Pax)</Label>
                  <Input type="number" min="1" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Time Slot</Label>
                  <select
                    value={resStartTime}
                    onChange={(e) => setResStartTime(e.target.value)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="12:00">12:00 PM (Lunch)</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="18:00">06:00 PM (Dinner)</option>
                    <option value="19:00">07:00 PM</option>
                    <option value="20:00">08:00 PM</option>
                    <option value="21:00">09:00 PM</option>
                  </select>
                </div>
              </div>
              <Button 
                onClick={handleCheckAvailability} 
                disabled={checkingAvailability}
                className="w-full rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-xs"
              >
                {checkingAvailability ? 'Checking tables...' : 'Find available tables'}
              </Button>
            </div>

            {/* Step 2: Book Details */}
            {availableTables.length > 0 && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">2. Customer & Table Details</span>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Available Table</Label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {availableTables.map(t => (
                        <option key={t.id} value={t.id}>Table T-{t.table_number} ({t.seats} seats)</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Guest Name</Label>
                      <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</Label>
                      <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="017xxxxxxxx" className="rounded-xl text-xs font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Special Notes</Label>
                    <Input value={resNotes} onChange={(e) => setResNotes(e.target.value)} placeholder="Window seat, dietary notes..." className="rounded-xl text-xs" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsReservationModalOpen(false)} className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            {availableTables.length > 0 && (
              <Button onClick={handleCreateReservation} className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Confirm booking
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Waitlist Entry Modal */}
      <Dialog open={isWaitlistModalOpen} onOpenChange={setIsWaitlistModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Add guest to waitlist
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Place walk-in party in active restaurant queue.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Guest Name <span className="text-rose-500">*</span></Label>
                <Input value={waitName} onChange={(e) => setWaitName(e.target.value)} placeholder="Full name" className="rounded-xl text-xs" autoFocus />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone <span className="text-rose-500">*</span></Label>
                <Input value={waitPhone} onChange={(e) => setWaitPhone(e.target.value)} placeholder="017xxxxxxxx" className="rounded-xl text-xs font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Party Size (Pax)</Label>
                <Input type="number" min="1" value={waitPartySize} onChange={(e) => setWaitPartySize(Number(e.target.value))} className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Est. Wait (Mins)</Label>
                <Input type="number" min="5" step="5" value={waitMins} onChange={(e) => setWaitMins(Number(e.target.value))} className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Seating Notes</Label>
              <Input value={waitNotes} onChange={(e) => setWaitNotes(e.target.value)} placeholder="Prefers booth / high chair..." className="rounded-xl text-xs" />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsWaitlistModalOpen(false)} className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <PermissionGuard permission="restaurant_reservations:create">
              <Button onClick={handleAddToWaitlist} className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Add to queue
              </Button>
            </PermissionGuard>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
