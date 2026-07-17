import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FilterBar from '../components/FilterBar';
import { useVehicles } from '../hooks/useVehicles';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { VehicleFilters } from '../types/vehicle';

const PAGE_SIZE = 12;
const GRID_REVEAL_DISTANCE_PX = 40;
const GRID_REVEAL_DURATION_S = 0.5;
const GRID_STAGGER_S = 0.08;
const GRID_LAYOUT_SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 };

/** Fahrzeugliste mit Filterleiste, Grid, Skeleton-/Empty-/Error-Zustaenden und Pagination. */
export default function VehicleListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const filters: VehicleFilters = useMemo(() => {
    const f: VehicleFilters = { pageSize: PAGE_SIZE };
    const page = searchParams.get('page');
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const fuelType = searchParams.get('fuelType');
    const transmission = searchParams.get('transmission');
    const maxPrice = searchParams.get('maxPrice');
    if (page) f.page = Number(page);
    if (q) f.q = q;
    if (category) f.category = category as VehicleFilters['category'];
    if (fuelType) f.fuelType = fuelType as VehicleFilters['fuelType'];
    if (transmission) f.transmission = transmission as VehicleFilters['transmission'];
    if (maxPrice) f.maxPrice = Number(maxPrice);
    return f;
    // searchParams.toString() als stabiler Vergleichswert fuer useMemo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const { data, vehicles, isLoading, error, refetch } = useVehicles(filters);

  function updateFilters(next: VehicleFilters) {
    const params: Record<string, string> = {};
    if (next.q) params.q = next.q;
    if (next.category) params.category = next.category;
    if (next.fuelType) params.fuelType = next.fuelType;
    if (next.transmission) params.transmission = next.transmission;
    if (next.maxPrice) params.maxPrice = String(next.maxPrice);
    setSearchParams(params);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    setSearchParams(params);
  }

  function resetFilters() {
    setSearchParams({});
  }

  return (
    <div className="section-container py-8">
      <div className="mb-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-dim">Fahrzeugsuche</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold text-graphite-900 sm:text-3xl">
          Finden Sie Ihr nächstes Fahrzeug
        </h1>
      </div>

      <div className="mb-4">
        <FilterBar filters={filters} onChange={updateFilters} />
      </div>

      {!isLoading && data && (
        <p className="mb-4 font-mono text-xs uppercase tracking-wide text-graphite-500">
          {data.total} {data.total === 1 ? 'Fahrzeug' : 'Fahrzeuge'} gefunden
        </p>
      )}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!error && isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !isLoading && vehicles.length === 0 && (
        <EmptyState
          title="Keine Fahrzeuge gefunden"
          message="Für Ihre Auswahl gibt es aktuell keine passenden Angebote. Passen Sie die Filter an oder setzen Sie sie zurück."
          actionLabel="Filter zurücksetzen"
          onAction={resetFilters}
        />
      )}

      {!error && !isLoading && vehicles.length > 0 && (
        <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                layout
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : GRID_REVEAL_DISTANCE_PX }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : GRID_REVEAL_DISTANCE_PX }}
                transition={{
                  layout: GRID_LAYOUT_SPRING,
                  opacity: { duration: GRID_REVEAL_DURATION_S, delay: prefersReducedMotion ? 0 : index * GRID_STAGGER_S },
                  y: { duration: GRID_REVEAL_DURATION_S, delay: prefersReducedMotion ? 0 : index * GRID_STAGGER_S },
                }}
              >
                <VehicleCard vehicle={vehicle} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 font-mono text-sm text-graphite-600">
          <button
            type="button"
            disabled={data.page <= 1}
            onClick={() => goToPage(data.page - 1)}
            className="flex min-h-[44px] cursor-pointer items-center rounded-full border border-graphite-900/15 px-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zurück
          </button>
          <span>
            Seite {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.page >= data.totalPages}
            onClick={() => goToPage(data.page + 1)}
            className="flex min-h-[44px] cursor-pointer items-center rounded-full border border-graphite-900/15 px-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
