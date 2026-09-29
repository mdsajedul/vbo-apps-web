'use client';

import { useState, useEffect } from 'react';
import { branchesApi, organizationsApi } from '@/lib/api';
import { useAuthorization } from '@/lib/hooks/useAuthorization';
import { useBranchStore } from '@/lib/branch-store';
import { RestaurantDashboard } from '@/components/dashboard/RestaurantDashboard';
import { RetailDashboard } from '@/components/dashboard/RetailDashboard';
import { ChefRestaurantDashboard } from '@/components/dashboard/ChefRestaurantDashboard';
import { CashierDashboard } from '@/components/dashboard/CashierDashboard';
import { GeneralStaffWorkspace } from '@/components/dashboard/GeneralStaffWorkspace';

export default function ErpOperationsDashboardPage() {
  const { hasPermission, isOwnerOrAdmin, isSuperAdmin, user } = useAuthorization();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [industryType, setIndustryType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function determineIndustry() {
      try {
        const [branchData, orgsData] = await Promise.all([
          branchesApi.getAll().catch(() => []),
          organizationsApi.getAll().catch(() => []),
        ]);

        const activeBranches = branchData.data || branchData || [];
        const activeOrgs = orgsData.data || orgsData || [];
        const defaultOrg = activeOrgs[0];

        let targetBranch = null;
        if (selectedBranchId && selectedBranchId !== 'ALL') {
          targetBranch = activeBranches.find((b: any) => b.id === selectedBranchId) || activeBranches[0];
        } else {
          targetBranch = activeBranches[0];
        }

        let resolvedVertical: string | null = null;

        if (selectedBranchId && selectedBranchId !== 'ALL' && targetBranch?.industry_type) {
          resolvedVertical = targetBranch.industry_type;
        }

        if (!resolvedVertical) {
          resolvedVertical =
            targetBranch?.organization?.default_industry_type ||
            defaultOrg?.default_industry_type ||
            null;
        }

        if (!resolvedVertical && user?.allowed_verticals && user.allowed_verticals.length === 1 && user.allowed_verticals[0] !== 'ALL') {
          resolvedVertical = user.allowed_verticals[0];
        }

        setIndustryType(resolvedVertical || 'RETAIL');
      } catch (err) {
        console.error('Failed to load branch industry type for dashboard', err);
        setIndustryType('RETAIL');
      } finally {
        setLoading(false);
      }
    }
    determineIndustry();
  }, [selectedBranchId, user]);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading VBO ERP Operational Workspace...</p>
      </div>
    );
  }

  if (isSuperAdmin || isOwnerOrAdmin() || hasPermission('reports:read') || hasPermission('analytics:read')) {
    if (industryType === 'RESTAURANT') {
      return <RestaurantDashboard />;
    }
    return <RetailDashboard />;
  }

  if (hasPermission('restaurant_kitchen:read') || hasPermission('restaurant_recipes:read')) {
    return <ChefRestaurantDashboard />;
  }

  if (hasPermission('pos:checkout') || hasPermission('pos:read')) {
    return <CashierDashboard />;
  }

  return <GeneralStaffWorkspace />;
}
