import { useState, useEffect, useCallback } from 'react';
import { masterDataApi, MasterDataEntry } from '@/lib/api';

export interface UseMasterDataOptions {
  activeOnly?: boolean;
  autoFetch?: boolean;
}

export function useMasterData(type: string, options: UseMasterDataOptions = {}) {
  const { activeOnly = true, autoFetch = true } = options;
  const [data, setData] = useState<MasterDataEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!type) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await masterDataApi.getByType(type, activeOnly);
      setData(res || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load master data');
    } finally {
      setIsLoading(false);
    }
  }, [type, activeOnly]);

  useEffect(() => {
    if (autoFetch && type) {
      fetchEntries();
    }
  }, [autoFetch, type, fetchEntries]);

  const getLabel = useCallback(
    (code: string, fallback = ''): string => {
      const entry = data.find((item) => item.code === code);
      return entry ? entry.label : fallback || code;
    },
    [data],
  );

  const getLabelBn = useCallback(
    (code: string, fallback = ''): string => {
      const entry = data.find((item) => item.code === code);
      return entry?.label_bn || entry?.label || fallback || code;
    },
    [data],
  );

  const getIcon = useCallback(
    (code: string): string | null => {
      const entry = data.find((item) => item.code === code);
      return entry?.icon || null;
    },
    [data],
  );

  const getColor = useCallback(
    (code: string): string | null => {
      const entry = data.find((item) => item.code === code);
      return entry?.color || null;
    },
    [data],
  );

  // Formatted for direct use in <Select> components
  const selectOptions = data.map((item) => ({
    label: item.label,
    value: item.code,
    label_bn: item.label_bn,
    icon: item.icon,
    color: item.color,
  }));

  return {
    data,
    isLoading,
    error,
    refetch: fetchEntries,
    getLabel,
    getLabelBn,
    getIcon,
    getColor,
    options: selectOptions,
  };
}
