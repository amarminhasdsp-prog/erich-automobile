import type { VehicleFilters, FuelType, TransmissionType, VehicleCategory } from '../types/vehicle';
import { categoryLabels, fuelTypeLabels, transmissionLabels } from '../utils/labels';

interface Props {
  filters: VehicleFilters;
  onChange: (filters: VehicleFilters) => void;
}

const inputClass =
  'min-h-[44px] cursor-pointer rounded-lg border border-graphite-900/10 bg-white px-3 py-2.5 text-sm text-graphite-900 transition-colors duration-200 hover:border-brass/60 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30';

/**
 * Filterleiste fuer die Fahrzeugliste: Freitext, Marke-agnostische Facetten.
 * Auf Mobile scrollt die Leiste horizontal statt umzubrechen (kein
 * hoher, sperriger Filterblock auf kleinen Screens); ab dem sm-Breakpoint
 * greift wieder das normale Flex-Wrap-Layout.
 */
export default function FilterBar({ filters, onChange }: Props) {
  function update(patch: Partial<VehicleFilters>) {
    onChange({ ...filters, ...patch, page: 1 });
  }

  return (
    <div className="flex gap-3 overflow-x-auto rounded-2xl border border-graphite-900/8 bg-white p-3 sm:flex-wrap sm:overflow-visible sm:p-4">
      <label className="sr-only" htmlFor="filter-q">
        Freitextsuche
      </label>
      <input
        id="filter-q"
        type="search"
        value={filters.q ?? ''}
        onChange={(e) => update({ q: e.target.value })}
        placeholder="Freitext suchen…"
        className={`${inputClass} min-w-[200px] flex-shrink-0 cursor-text sm:flex-1`}
      />

      <label className="sr-only" htmlFor="filter-category">
        Fahrzeugkategorie
      </label>
      <select
        id="filter-category"
        value={filters.category ?? ''}
        onChange={(e) => update({ category: (e.target.value || undefined) as VehicleCategory | undefined })}
        className={`${inputClass} flex-shrink-0`}
      >
        <option value="">Alle Kategorien</option>
        {Object.entries(categoryLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filter-fuel">
        Kraftstoffart
      </label>
      <select
        id="filter-fuel"
        value={filters.fuelType ?? ''}
        onChange={(e) => update({ fuelType: (e.target.value || undefined) as FuelType | undefined })}
        className={`${inputClass} flex-shrink-0`}
      >
        <option value="">Alle Kraftstoffarten</option>
        {Object.entries(fuelTypeLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filter-transmission">
        Getriebe
      </label>
      <select
        id="filter-transmission"
        value={filters.transmission ?? ''}
        onChange={(e) => update({ transmission: (e.target.value || undefined) as TransmissionType | undefined })}
        className={`${inputClass} flex-shrink-0`}
      >
        <option value="">Alle Getriebearten</option>
        {Object.entries(transmissionLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
