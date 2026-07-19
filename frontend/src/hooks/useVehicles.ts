import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchVehicles } from '../api/client';
import type { Vehicle, VehicleFilters, VehicleListResponse } from '../types/vehicle';

interface UseVehiclesResult {
  data: VehicleListResponse | null;
  vehicles: Vehicle[];
  isLoading: boolean;
  /** true, waehrend die (unwichtigeren) Fahrzeuge 7+ der aktuellen Seite noch im Hintergrund nachladen. */
  isLoadingMore: boolean;
  error: string | null;
  refetch: () => void;
}

/** Anzahl der Fahrzeuge, die sofort/priorisiert geladen werden (Above-the-fold). */
const PRIORITY_COUNT = 6;

/**
 * Laedt Fahrzeuge anhand von Filtern und haelt Loading-/Error-Zustand.
 *
 * Performance-Optimierung: Statt die komplette Seite (z.B. 12 Fahrzeuge) in
 * einem Request zu laden, wird zuerst nur ein kleiner "Priority"-Request mit
 * den ersten PRIORITY_COUNT Fahrzeugen abgesetzt (schnellere Time-to-Content,
 * kleinere Response). Ist die angeforderte pageSize groesser, wird direkt
 * danach ein zweiter Request fuer die restlichen Fahrzeuge derselben Seite
 * nachgeschickt und das Ergebnis zusammengefuehrt - fuer den Nutzer sichtbar
 * als "die ersten 6 erscheinen sofort, der Rest poppt kurz danach nach".
 */
export function useVehicles(filters: VehicleFilters): UseVehiclesResult {
  const [data, setData] = useState<VehicleListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    const requestedPageSize = filters.pageSize ?? PRIORITY_COUNT;
    const priorityCount = Math.min(PRIORITY_COUNT, requestedPageSize);

    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);

    fetchVehicles({ ...filters, pageSize: priorityCount })
      .then((priorityRes) => {
        if (isStale()) return;
        setData(priorityRes);
        setIsLoading(false);

        // Rest der Seite im Hintergrund nachladen, ohne die bereits
        // angezeigten priorisierten Fahrzeuge zu blockieren.
        if (requestedPageSize > priorityCount && priorityRes.total > priorityCount) {
          setIsLoadingMore(true);
          fetchVehicles({ ...filters, pageSize: requestedPageSize })
            .then((fullRes) => {
              if (isStale()) return;
              setData(fullRes);
            })
            .catch(() => {
              // Nachladen ist best-effort: die priorisierten Fahrzeuge
              // bleiben sichtbar, ein Fehler hier eskaliert nicht zum
              // globalen Error-State.
            })
            .finally(() => {
              if (!isStale()) setIsLoadingMore(false);
            });
        }
      })
      .catch((err: Error) => {
        if (!isStale()) {
          setError(err.message);
          setIsLoading(false);
        }
      });

    // filtersKey deckt den inhaltlichen Vergleich der Filter ab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, vehicles: data?.items ?? [], isLoading, isLoadingMore, error, refetch };
}
