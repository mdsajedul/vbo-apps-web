'use client';

import { useState, useEffect, useRef } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import { branchesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, Layers, Store, Users, User, 
  ArrowRightLeft, DollarSign, Check, X, Grid, Sliders, 
  ChevronDown, ShoppingBag, Receipt, Sparkles 
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface Branch {
  id: string;
  name: string;
}

interface FloorPlan {
  id: string;
  name: string;
  dining_zones: DiningZone[];
}

interface DiningZone {
  id: string;
  name: string;
  tables: Table[];
}

interface Table {
  id: string;
  table_number: string;
  seats: number;
  shape: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'BLOCKED';
  table_sessions?: Array<{
    id: string;
    guest_count: number;
    waiter_id: string;
    opened_at: string;
    orders: Array<{
      id: string;
      order_items: Array<{
        id: string;
        product_name: string;
        quantity: string;
        unit_price: number;
        line_total: number;
      }>;
    }>;
  }>;
}

export default function RestaurantTablesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(null);
  const [selectedZone, setSelectedZone] = useState<DiningZone | null>(null);
  const [isDesignMode, setIsDesignMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Form states
  const [newFloorPlanName, setNewFloorPlanName] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  
  // Table form states
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableSeats, setTableSeats] = useState(4);
  const [tableShape, setTableShape] = useState<'SQUARE' | 'ROUND' | 'RECTANGLE'>('SQUARE');
  const [tableX, setTableX] = useState(30);
  const [tableY, setTableY] = useState(30);
  const [tableW, setTableW] = useState(110);
  const [tableH, setTableH] = useState(110);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  // Active Session states
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [waiterId, setWaiterId] = useState('');

  // Fetch branches
  useEffect(() => {
    async function loadInitial() {
      try {
        const branchRes = await branchesApi.getAll();
        const branchList = Array.isArray(branchRes) ? branchRes : branchRes?.data || [];
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
    loadInitial();
  }, []);

  // Fetch Floor Plans when branch changes
  useEffect(() => {
    if (!selectedBranchId) {
      setLoading(false);
      return;
    }
    loadFloorPlans();
  }, [selectedBranchId]);

  async function loadFloorPlans() {
    setLoading(true);
    try {
      const res = await restaurantApi.getFloorPlans(selectedBranchId);
      const planList = Array.isArray(res) ? res : [];
      setFloorPlans(planList);

      setSelectedFloorPlan(prevPlan => {
        if (planList.length === 0) {
          setSelectedZone(null);
          return null;
        }
        
        const nextPlan = prevPlan ? planList.find((p: FloorPlan) => p.id === prevPlan.id) || planList[0] : planList[0];
        
        setSelectedZone(prevZone => {
          if (!nextPlan.dining_zones || nextPlan.dining_zones.length === 0) return null;
          return prevZone ? nextPlan.dining_zones.find((z: DiningZone) => z.id === prevZone.id) || nextPlan.dining_zones[0] : nextPlan.dining_zones[0];
        });
        
        return nextPlan;
      });
    } catch (err) {
      toast.error('Failed to load floor plans');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateFloorPlan = async () => {
    if (!newFloorPlanName.trim()) return;
    try {
      await restaurantApi.createFloorPlan({
        branch_id: selectedBranchId,
        name: newFloorPlanName,
        layout_json: '{}'
      });
      toast.success('Floor plan created successfully');
      setNewFloorPlanName('');
      setIsFloorPlanModalOpen(false);
      loadFloorPlans();
    } catch (err) {
      toast.error('Failed to create floor plan');
    }
  };

  const handleCreateZone = async () => {
    if (!selectedFloorPlan || !newZoneName.trim()) return;
    try {
      await restaurantApi.createZone({
        floor_plan_id: selectedFloorPlan.id,
        name: newZoneName,
        sort_order: (selectedFloorPlan.dining_zones?.length || 0) + 1
      });
      toast.success('Dining zone created');
      setNewZoneName('');
      setIsZoneModalOpen(false);
      loadFloorPlans();
    } catch (err) {
      toast.error('Failed to create zone');
    }
  };

  const handleSaveTable = async () => {
    if (!selectedZone || !tableNumber.trim()) return;
    try {
      const payload = {
        zone_id: selectedZone.id,
        table_number: tableNumber,
        seats: Number(tableSeats),
        shape: tableShape,
        position_x: Number(tableX),
        position_y: Number(tableY),
        width: Number(tableW),
        height: Number(tableH)
      };

      if (editingTable) {
        await restaurantApi.updateTable(editingTable.id, payload);
        toast.success('Table updated');
      } else {
        await restaurantApi.createTable(payload);
        toast.success('Table added');
      }

      setIsTableModalOpen(false);
      setEditingTable(null);
      loadFloorPlans();
    } catch (err) {
      toast.error('Failed to save table');
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    try {
      await restaurantApi.updateTable(tableToDelete, { status: 'BLOCKED' });
      toast.success('Table removed');
      loadFloorPlans();
    } catch (err) {
      toast.error('Failed to remove table');
    } finally {
      setTableToDelete(null);
    }
  };

  const handleDeleteFloorPlan = async () => {
    if (!planToDelete) return;
    try {
      await restaurantApi.deleteFloorPlan(planToDelete);
      toast.success('Floor plan removed');
      loadFloorPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to remove floor plan');
    } finally {
      setPlanToDelete(null);
    }
  };

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;
    try {
      await restaurantApi.deleteZone(zoneToDelete);
      toast.success('Dining zone removed');
      loadFloorPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to remove dining zone');
    } finally {
      setZoneToDelete(null);
    }
  };

  const handleOpenTableModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setTableNumber(table.table_number);
      setTableSeats(table.seats);
      setTableShape(table.shape as any);
      setTableX(table.position_x);
      setTableY(table.position_y);
      setTableW(table.width);
      setTableH(table.height);
    } else {
      const count = selectedZone?.tables?.length || 0;
      const col = count % 4;
      const row = Math.floor(count / 4);
      
      setEditingTable(null);
      setTableNumber(String(count + 1));
      setTableSeats(4);
      setTableShape('SQUARE');
      setTableX(30 + col * 140);
      setTableY(30 + row * 140);
      setTableW(110);
      setTableH(110);
    }
    setIsTableModalOpen(true);
  };

  // Drag and Drop canvas placement for tables
  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDesignMode || !selectedZone || !canvasRef.current) return;
    
    const tableId = e.dataTransfer.getData('text/plain');
    if (!tableId) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const rawX = e.clientX - canvasRect.left - 55;
    const rawY = e.clientY - canvasRect.top - 55;
    
    const newX = Math.max(10, Math.round(rawX / 10) * 10);
    const newY = Math.max(10, Math.round(rawY / 10) * 10);

    setSelectedZone(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tables: prev.tables.map(t => t.id === tableId ? { ...t, position_x: newX, position_y: newY } : t)
      };
    });

    try {
      await restaurantApi.updateTable(tableId, { position_x: newX, position_y: newY });
      toast.success('Table position updated');
    } catch (err) {
      toast.error('Failed to update table position');
    }
  };

  const handleTableClick = (table: Table) => {
    if (isDesignMode) {
      handleOpenTableModal(table);
    } else {
      setActiveTable(table);
      if (table.status === 'AVAILABLE') {
        setGuestCount(2);
        setWaiterId('');
        setIsSessionModalOpen(true);
      } else if (table.status === 'OCCUPIED') {
        setIsSessionModalOpen(true);
      }
    }
  };

  const handleStartSession = async () => {
    if (!activeTable) return;
    try {
      await restaurantApi.openSession({
        table_id: activeTable.id,
        guest_count: guestCount,
        waiter_id: waiterId || undefined
      });
      toast.success('Table session opened');
      setIsSessionModalOpen(false);
      loadFloorPlans();
    } catch (err) {
      toast.error('Failed to open session');
    }
  };

  const getTableBillTotal = (table: Table) => {
    const session = table.table_sessions?.[0];
    if (!session) return 0;
    return session.orders.reduce((acc, order) => 
      acc + order.order_items.reduce((itemAcc, item) => itemAcc + Number(item.line_total), 0)
    , 0);
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Table & floor management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage visual dining layouts, table sessions, and live occupancy status.
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

          {/* Design Mode Switch */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <Switch
              id="design-mode"
              checked={isDesignMode}
              onCheckedChange={setIsDesignMode}
            />
            <Label htmlFor="design-mode" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer select-none">
              <Sliders className="w-3.5 h-3.5" /> Design Mode
            </Label>
          </div>
        </div>
      </div>

      {/* Main Floor Plan Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar layouts/zones listing */}
        <div className="lg:col-span-4 space-y-4">
          {/* Layout Plans Card */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Floor Layout Plans</h3>
                <p className="text-[11px] text-slate-400">Physical levels & dining areas</p>
              </div>
              <PermissionGuard permission="restaurant_tables:create">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg h-7 px-2 text-xs border-slate-200 dark:border-slate-700" 
                  onClick={() => setIsFloorPlanModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Plan
                </Button>
              </PermissionGuard>
            </div>
            <CardContent className="p-3 space-y-1.5">
              {floorPlans.map(plan => (
                <div 
                  key={plan.id} 
                  className={cn(
                    "flex items-center justify-between w-full group rounded-xl p-2.5 transition-all text-xs",
                    selectedFloorPlan?.id === plan.id 
                      ? "bg-indigo-600 text-white font-bold shadow-2xs" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  )}
                >
                  <button
                    onClick={() => {
                      setSelectedFloorPlan(plan);
                      setSelectedZone(plan.dining_zones?.[0] || null);
                    }}
                    className="flex-1 text-left truncate font-semibold"
                  >
                    {plan.name}
                  </button>
                  <PermissionGuard permission="restaurant_tables:delete">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlanToDelete(plan.id);
                      }}
                      disabled={(plan.dining_zones?.length || 0) > 0}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        selectedFloorPlan?.id === plan.id
                          ? "text-white/60 hover:text-white"
                          : "text-slate-400 hover:text-rose-600",
                        (plan.dining_zones?.length || 0) > 0 && "opacity-30 cursor-not-allowed"
                      )}
                      title={(plan.dining_zones?.length || 0) > 0 ? "Cannot delete plan with zones" : "Delete Floor Plan"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </PermissionGuard>
                </div>
              ))}
              {floorPlans.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No floor plans created yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Dining Zones Card */}
          {selectedFloorPlan && (
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dining Zones</h3>
                  <p className="text-[11px] text-slate-400">Sections in {selectedFloorPlan.name}</p>
                </div>
                <PermissionGuard permission="restaurant_tables:create">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-lg h-7 px-2 text-xs border-slate-200 dark:border-slate-700" 
                    onClick={() => setIsZoneModalOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Zone
                  </Button>
                </PermissionGuard>
              </div>
              <CardContent className="p-3 space-y-1.5">
                {selectedFloorPlan.dining_zones?.map(zone => (
                  <div 
                    key={zone.id} 
                    className={cn(
                      "flex items-center justify-between w-full group rounded-xl p-2.5 transition-all text-xs",
                      selectedZone?.id === zone.id 
                        ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium"
                    )}
                  >
                    <button
                      onClick={() => setSelectedZone(zone)}
                      className="flex-1 flex items-center justify-between text-left truncate pr-2"
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Layers className="w-3.5 h-3.5 text-slate-400" /> {zone.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 font-normal">
                        {zone.tables?.length || 0} tables
                      </span>
                    </button>
                    <PermissionGuard permission="restaurant_tables:delete">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoneToDelete(zone.id);
                        }}
                        disabled={(zone.tables?.length || 0) > 0}
                        className={cn(
                          "p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors",
                          (zone.tables?.length || 0) > 0 && "opacity-30 cursor-not-allowed"
                        )}
                        title={(zone.tables?.length || 0) > 0 ? "Cannot delete zone with tables" : "Delete Dining Zone"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGuard>
                  </div>
                ))}
                {(!selectedFloorPlan.dining_zones || selectedFloorPlan.dining_zones.length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-4">No dining zones in this floor plan.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visual Floor Canvas */}
        <div className="lg:col-span-8 min-w-0">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs h-[560px] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedZone ? selectedZone.name : 'Dining room canvas'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isDesignMode ? 'Drag tables to reposition coordinates on the visual grid.' : 'Click any table to open session or view active orders.'}
                </p>
              </div>
              {isDesignMode && selectedZone && (
                <PermissionGuard permission="restaurant_tables:create">
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenTableModal()} 
                    className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3.5 shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add table
                  </Button>
                </PermissionGuard>
              )}
            </div>

            <div className="flex-1 relative overflow-auto p-6 bg-slate-50/30 dark:bg-slate-950/20">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Spinner className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
                  <span className="text-xs">Loading floor plan layout...</span>
                </div>
              ) : selectedZone ? (
                <div 
                  ref={canvasRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleCanvasDrop}
                  className="w-full h-full min-h-[440px] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl relative p-4"
                >
                  {selectedZone.tables?.map((table, idx) => {
                    const isOccupied = table.status === 'OCCUPIED';
                    const isReserved = table.status === 'RESERVED';
                    const isCleaning = table.status === 'CLEANING';

                    let colorClasses = 'border-emerald-500/60 bg-emerald-50/70 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100/70';
                    if (isOccupied) colorClasses = 'border-blue-500/60 bg-blue-50/70 text-blue-900 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-500/40 hover:bg-blue-100/70';
                    if (isReserved) colorClasses = 'border-amber-500/60 bg-amber-50/70 text-amber-900 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-500/40 hover:bg-amber-100/70';
                    if (isCleaning) colorClasses = 'border-purple-500/60 bg-purple-50/70 text-purple-900 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-500/40 hover:bg-purple-100/70';

                    const col = idx % 4;
                    const row = Math.floor(idx / 4);
                    const defaultX = 30 + col * 140;
                    const defaultY = 30 + row * 140;

                    const posX = (table.position_x && table.position_x !== 50) ? table.position_x : defaultX;
                    const posY = (table.position_y && table.position_y !== 50) ? table.position_y : defaultY;

                    return (
                      <div
                        key={table.id}
                        draggable={isDesignMode}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', table.id);
                        }}
                        onClick={() => handleTableClick(table)}
                        style={{
                          left: `${posX}px`,
                          top: `${posY}px`,
                          width: `${table.width || 110}px`,
                          height: `${table.height || 110}px`,
                          position: 'absolute',
                        }}
                        className={cn(
                          "border-2 rounded-2xl flex flex-col items-center justify-center shadow-xs transition-all cursor-pointer select-none text-center p-2",
                          colorClasses,
                          isDesignMode && "hover:scale-105 active:cursor-grabbing border-dashed"
                        )}
                      >
                        {isDesignMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTableToDelete(table.id);
                            }}
                            className="absolute top-1 right-1 p-1 hover:bg-rose-500/20 text-rose-600 rounded-md transition-colors"
                            title="Remove Table"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="font-bold text-base tracking-tight font-mono">T-{table.table_number}</span>
                        <span className="text-[11px] font-medium opacity-85 flex items-center gap-0.5 mt-0.5">
                          <Users className="w-3 h-3" /> {table.seats} Seats
                        </span>
                        {isOccupied && (
                          <span className="text-[10px] mt-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded-full font-mono font-bold shadow-2xs">
                            ৳ {(getTableBillTotal(table) / 100).toFixed(0)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {(!selectedZone.tables || selectedZone.tables.length === 0) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Grid className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-medium">No tables in this zone yet. Toggle Design Mode to add tables.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Store className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-medium">Select a Layout Plan & Zone from the left sidebar.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Floor Plan Modal */}
      <Dialog open={isFloorPlanModalOpen} onOpenChange={setIsFloorPlanModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  New layout plan
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define a physical dining level or branch floor.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Floor Plan Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Ground Floor Dining, Rooftop Terrace"
                value={newFloorPlanName}
                onChange={(e) => setNewFloorPlanName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                autoFocus
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsFloorPlanModalOpen(false)} className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <PermissionGuard permission="restaurant_tables:create">
              <Button onClick={handleCreateFloorPlan} className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Create plan
              </Button>
            </PermissionGuard>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zone Modal */}
      <Dialog open={isZoneModalOpen} onOpenChange={setIsZoneModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  New dining zone
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Segment floor plans into operational service areas.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Zone Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. AC Family Section, VIP Lounge, Bar Area"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                autoFocus
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsZoneModalOpen(false)} className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <PermissionGuard permission="restaurant_tables:create">
              <Button onClick={handleCreateZone} className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Create zone
              </Button>
            </PermissionGuard>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Modal */}
      <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {editingTable ? 'Edit dining table' : 'Add dining table'}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure table label, seating capacity, and shape.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Table Number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. 1, A1, VIP-1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Seating Capacity <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={tableSeats}
                  onChange={(e) => setTableSeats(Number(e.target.value))}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Shape</Label>
                <select
                  value={tableShape}
                  onChange={(e) => setTableShape(e.target.value as any)}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="SQUARE">Square</option>
                  <option value="ROUND">Round</option>
                  <option value="RECTANGLE">Rectangle</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Grid Position X / Y</Label>
                <div className="flex gap-2">
                  <Input type="number" value={tableX} onChange={(e) => setTableX(Number(e.target.value))} placeholder="X" className="h-10 text-xs font-mono rounded-xl" />
                  <Input type="number" value={tableY} onChange={(e) => setTableY(Number(e.target.value))} placeholder="Y" className="h-10 text-xs font-mono rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsTableModalOpen(false)} className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <PermissionGuard permission="restaurant_tables:update">
              <Button onClick={handleSaveTable} className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Save table
              </Button>
            </PermissionGuard>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Modal */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Table {activeTable?.table_number} Service Session
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTable?.status === 'OCCUPIED' ? 'Active guest dining session and running bill.' : 'Seat guests and start dining session.'}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {activeTable?.status === 'AVAILABLE' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Guest Count
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Assigned Waiter / Server Name
                  </Label>
                  <Input
                    placeholder="e.g. John D."
                    value={waiterId}
                    onChange={(e) => setWaiterId(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Running Bill Subtotal:</span>
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    ৳ {activeTable ? (getTableBillTotal(activeTable) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Table is currently active with seated guests.
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsSessionModalOpen(false)} className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700">
              Close
            </Button>
            {activeTable?.status === 'AVAILABLE' && (
              <Button onClick={handleStartSession} className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Start dining session
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!tableToDelete}
        onClose={() => setTableToDelete(null)}
        onConfirm={handleDeleteTable}
        title="Delete Table"
        description="Are you sure you want to delete this table? This will block the table from usage."
        variant="destructive"
      />
      <ConfirmDialog
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeleteFloorPlan}
        title="Delete Layout Plan"
        description="Are you sure you want to delete this Layout Plan? This action cannot be undone."
        variant="destructive"
      />
      <ConfirmDialog
        isOpen={!!zoneToDelete}
        onClose={() => setZoneToDelete(null)}
        onConfirm={handleDeleteZone}
        title="Delete Dining Zone"
        description="Are you sure you want to delete this Dining Zone? This action cannot be undone."
        variant="destructive"
      />
    </div>
  );
}
