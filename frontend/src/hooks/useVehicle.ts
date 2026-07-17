import { useEffect, useState } from 'react';
import { fetchVehicle } from '../api/client';
import type { Vehicle } from '../types/vehicle';

interface UseVehicleResult {
  vehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;
}

export function useVehicle(id: string | undefined): UseVehicleResult {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchVehicle(id)
      .then((res) => {
        if (!cancelled) setVehicle(res);
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
  }, [id]);

  return { vehicle, isLoading, error };
}
