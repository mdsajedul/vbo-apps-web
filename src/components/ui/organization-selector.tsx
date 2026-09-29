'use client';
import { useState, useEffect } from 'react';
import { organizationsApi } from '@/lib/api';
import { Building2 } from 'lucide-react';

interface OrganizationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function OrganizationSelector({ value, onChange, className = '' }: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await organizationsApi.getAll();
        const data = res.data || res;
        setOrganizations(Array.isArray(data) ? data : []);
        
        if (!value && data && data.length > 0) {
          // Find primary or default to first
          const primary = data.find((o: any) => o.is_primary);
          onChange(primary ? primary.id : data[0].id);
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="h-9 w-48 bg-slate-100 rounded-md animate-pulse"></div>;
  }

  if (organizations.length <= 1) {
    return null; // Don't show if there's only 0 or 1 organization
  }

  return (
    <div className={`relative flex items-center bg-white border border-slate-200 rounded-md overflow-hidden h-9 ${className}`}>
      <div className="pl-3 pr-2 flex items-center text-slate-400 bg-slate-50 border-r border-slate-200 h-full">
        <Building2 className="w-4 h-4" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent border-none text-sm font-medium text-slate-700 pl-2 pr-8 h-full focus:ring-0 focus:outline-none appearance-none"
      >
        <option value="">All Organizations</option>
        {organizations.map(org => (
          <option key={org.id} value={org.id}>{org.name}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
