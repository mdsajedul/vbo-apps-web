'use client';

import { useState, useEffect } from 'react';
import { useAuthorization } from '../../lib/hooks/useAuthorization';
import { branchesApi, organizationsApi, masterDataApi } from '../../lib/api';
import { AlertCircle } from 'lucide-react';

export default function BranchSetupGuard({ children }: { children: React.ReactNode }) {
  const { isOwnerOrAdmin, user } = useAuthorization();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [selectedVertical, setSelectedVertical] = useState<string>('');
  const [availableVerticals, setAvailableVerticals] = useState<{ id: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkBranchAndInheritance = async () => {
      try {
        const [branchesResponse, orgsResponse, masterVerticals] = await Promise.all([
          branchesApi.getAll().catch(() => []),
          organizationsApi.getAll().catch(() => []),
          masterDataApi.getByType('INDUSTRY_VERTICAL').catch(() => []),
        ]);

        const activeBranches = branchesResponse.data || branchesResponse || [];
        const activeBranch = activeBranches[0];
        const activeOrgs = orgsResponse.data || orgsResponse || [];
        const activeOrg = activeOrgs[0];

        if (activeOrg) {
          setActiveOrgId(activeOrg.id);
        }

        // Derive allowed verticals dynamically from user's plan
        const userAllowedVerticals = user?.allowed_verticals || [];
        const isUniversalPlan = userAllowedVerticals.includes('ALL');
        const activeMaster = (masterVerticals || []).filter((v: any) => v.is_active);

        let filtered = activeMaster;
        if (!isUniversalPlan && userAllowedVerticals.length > 0) {
          filtered = activeMaster.filter((v: any) => userAllowedVerticals.includes(v.code));
        }

        if (filtered.length === 0 && activeMaster.length > 0) {
          filtered = activeMaster;
        }

        const mapped = filtered.map((v: any) => ({ id: v.code, label: v.label }));
        setAvailableVerticals(mapped);

        if (activeBranch) {
          setActiveBranchId(activeBranch.id);

          if (!activeBranch.industry_type) {
            // Case 1: Single-vertical plan -> auto-inherit and auto-save
            if (mapped.length === 1) {
              const singleVertical = mapped[0].id;
              await branchesApi.update(activeBranch.id, { industry_type: singleVertical });
              if (activeOrg && !activeOrg.default_industry_type) {
                await organizationsApi.update(activeOrg.id, { default_industry_type: singleVertical });
              }
              window.location.reload();
              return;
            }

            // Case 2: Multi-vertical plan, but Organization already has default_industry_type -> inherit from org
            if (activeOrg?.default_industry_type && mapped.some(m => m.id === activeOrg.default_industry_type)) {
              await branchesApi.update(activeBranch.id, { industry_type: activeOrg.default_industry_type });
              window.location.reload();
              return;
            }

            // Case 3: Needs explicit setup by tenant owner/admin
            setNeedsSetup(true);
            if (mapped.length > 0) {
              setSelectedVertical(mapped[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to verify branch setup status', err);
      } finally {
        setLoading(false);
      }
    };

    checkBranchAndInheritance();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVertical || !activeBranchId) return;

    setSubmitting(true);
    try {
      const updatePromises: Promise<any>[] = [
        branchesApi.update(activeBranchId, { industry_type: selectedVertical })
      ];
      if (activeOrgId) {
        updatePromises.push(organizationsApi.update(activeOrgId, { default_industry_type: selectedVertical }));
      }
      await Promise.all(updatePromises);
      setNeedsSetup(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to setup branch vertical', err);
      alert('Failed to set up branch. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>;
  }

  if (needsSetup) {
    if (!isOwnerOrAdmin()) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Branch Not Configured</h2>
            <p className="text-slate-500 dark:text-slate-400">
              This branch has not been fully configured yet. Please contact your administrator to set up the branch industry vertical.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Branch Setup Required</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Please select the primary industry vertical for this location. This determines which features and interfaces are available.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Industry Type
              </label>
              <select
                required
                className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                value={selectedVertical}
                onChange={(e) => setSelectedVertical(e.target.value)}
              >
                <option value="">Select a vertical...</option>
                {availableVerticals.map(vertical => (
                  <option key={vertical.id} value={vertical.id}>{vertical.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedVertical}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
