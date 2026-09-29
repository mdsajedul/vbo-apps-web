'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { branchesApi } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';
import { BranchRequiredGuard } from '@/components/guards/BranchRequiredGuard';

function PosRouterInner() {
  const router = useRouter();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineIndustryRoute() {
      try {
        const branchData = await branchesApi.getAll();
        const activeBranches = branchData.data || branchData || [];
        const currentBranch =
          selectedBranchId && selectedBranchId !== 'ALL'
            ? activeBranches.find((b: any) => b.id === selectedBranchId) || activeBranches[0]
            : activeBranches[0];

        const effectiveVertical =
          currentBranch?.industry_type ||
          currentBranch?.organization?.default_industry_type;

        // Route based on active branch industry type
        if (effectiveVertical === 'RESTAURANT') {
          router.replace('/pos/restaurant');
        } else {
          router.replace('/pos/retail');
        }
      } catch (err) {
        // Default fallback to retail POS
        router.replace('/pos/retail');
      } finally {
        setLoading(false);
      }
    }
    determineIndustryRoute();
  }, [router, selectedBranchId]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300 font-sans">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
        <h2 className="text-lg font-bold text-white tracking-tight">Routing to POS Terminal Engine...</h2>
        <p className="text-xs text-slate-500 font-mono">Initializing selected branch context...</p>
      </div>
    </div>
  );
}

export default function PosAutoRouterPage() {
  return (
    <BranchRequiredGuard featureName="Point of Sale">
      <PosRouterInner />
    </BranchRequiredGuard>
  );
}
