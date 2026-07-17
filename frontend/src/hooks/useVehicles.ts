import { useEffect, useState, useCallback } from 'react';
import { fetchVehicles } from '../api/client';
import type { Vehicle, VehicleFilters, VehicleListResponse } from '../types/vehicle';

interface UseVehiclesResult {
  data: VehicleListResponse | null;
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Laedt Fahrzeuge anhand von Filtern und haelt Loading-/Error-Zustand. */
export function useVehicles(filters: VehicleFilters): UseVehiclesResult {
  const [data, setData] = useState<VehicleListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchVehicles(filters)
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
    // filtersKey deckt den inhaltlichen Vergleich der Filter ab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, vehicles: data?.items ?? [], isLoading, error, refetch };
}
