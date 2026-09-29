'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { warehouseApi, branchesApi } from '@/lib/api';
import { ArrowLeft, Layers, Check } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const zoneSchema = z.object({
  branch_id: z.string().min(1, 'Branch is required'),
  name: z.string().min(1, 'Zone Name is required'),
  type: z.string().min(1, 'Zone Type is required'),
});

type ZoneFormValues = z.infer<typeof zoneSchema>;

export default function NewZonePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      branch_id: '',
      name: '',
      type: 'STORAGE',
    }
  });

  useEffect(() => {
    branchesApi.getAll().then(res => {
      const data = res.data || res || [];
      setBranches(data);
      if (data.length > 0) {
        form.setValue('branch_id', data[0].id);
      }
    }).catch(console.error);
  }, []);

  const onSubmit = async (data: ZoneFormValues) => {
    setLoading(true);
    try {
      await warehouseApi.createZone(data);
      toast.success('Zone created successfully');
      router.push('/warehouse');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create zone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-16 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 pt-1">
        <Link href="/warehouse">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Add storage zone
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create a logical or physical warehouse staging zone.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <CardContent className="p-6 space-y-5">
            {/* Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Operating Branch <span className="text-rose-500">*</span>
              </label>
              <select 
                {...form.register('branch_id')} 
                className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.branch_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <FormError message={form.formState.errors.branch_id?.message} />
            </div>

            {/* Zone Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Zone Name <span className="text-rose-500">*</span>
              </label>
              <Input 
                placeholder="e.g. Aisle A, Cold Storage, Receiving Dock" 
                {...form.register('name')} 
                className={`h-10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} 
              />
              <FormError message={form.formState.errors.name?.message} />
            </div>

            {/* Zone Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Zone Purpose / Type <span className="text-rose-500">*</span>
              </label>
              <select 
                {...form.register('type')} 
                className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.type ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <option value="STORAGE">Storage (Standard inventory)</option>
                <option value="RECEIVING">Receiving (Dock incoming)</option>
                <option value="PICKING">Picking (Fulfillment packing)</option>
                <option value="DISPATCH">Dispatch (Outbound loading)</option>
                <option value="QUARANTINE">Quarantine (Inspection hold)</option>
              </select>
              <FormError message={form.formState.errors.type?.message} />
            </div>
          </CardContent>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/warehouse')}
              className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
            >
              Cancel
            </Button>
            <PermissionGuard permission="warehouse:create">
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-6 shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{loading ? 'Creating...' : 'Create zone'}</span>
              </Button>
            </PermissionGuard>
          </div>
        </Card>
      </form>
    </div>
  );
}
