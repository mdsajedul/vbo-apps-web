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

export default function DashboardPage() {
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

        // 1. If a specific branch is selected, use its industry_type
        if (selectedBranchId && selectedBranchId !== 'ALL' && targetBranch?.industry_type) {
          resolvedVertical = targetBranch.industry_type;
        }

        // 2. If 'ALL' is selected or branch industry_type is unset, fallback to organization default_industry_type
        if (!resolvedVertical) {
          resolvedVertical =
            targetBranch?.organization?.default_industry_type ||
            defaultOrg?.default_industry_type ||
            null;
        }

        // 3. Fallback to single plan vertical if defined
        if (!resolvedVertical && user?.allowed_verticals && user.allowed_verticals.length === 1 && user.allowed_verticals[0] !== 'ALL') {
          resolvedVertical = user.allowed_verticals[0];
        }

        // 4. Default fallback to RETAIL
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
        <p className="text-xs font-semibold text-slate-500">Loading Workspace...</p>
      </div>
    );
  }

  // 1. Executive / Owner / Manager with Reporting Permissions
  if (isSuperAdmin || isOwnerOrAdmin() || hasPermission('reports:read') || hasPermission('analytics:read')) {
    if (industryType === 'RESTAURANT') {
      return <RestaurantDashboard />;
    }
    return <RetailDashboard />;
  }

  // 2. Kitchen Staff / Master Chef
  if (hasPermission('restaurant_kitchen:read') || hasPermission('restaurant_recipes:read')) {
    return <ChefRestaurantDashboard />;
  }

  // 3. Front of House / Cashier
  if (hasPermission('pos:checkout') || hasPermission('pos:read')) {
    return <CashierDashboard />;
  }

  // 4. General Operational Staff Workspace Fallback
  return <GeneralStaffWorkspace />;
}
