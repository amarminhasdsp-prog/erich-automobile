import { useCallback, useEffect, useState } from 'react';
import { fetchAdminVehicles } from '../api/adminClient';
import type { Vehicle, VehicleFilters, VehicleListResponse } from '../../types/vehicle';

interface UseAdminVehiclesResult {
  data: VehicleListResponse | null;
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Laedt alle Inserate inkl. Entwuerfe fuer das Admin-Dashboard. */
export function useAdminVehicles(filters: VehicleFilters = {}): UseAdminVehiclesResult {
  const [data, setData] = useState<VehicleListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchAdminVehicles(filters)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, vehicles: data?.items ?? [], isLoading, error, refetch };
}
