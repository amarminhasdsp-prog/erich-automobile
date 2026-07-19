import { formatDate, formatMileage, fuelTypeLabels, transmissionLabels } from '../utils/labels';
import type { Vehicle } from '../types/vehicle';
import clsx from 'clsx';

interface Props {
  vehicle: Vehicle;
  className?: string;
}

/**
 * Signature-Element der Seite: die Typenschild-Leiste.
 * Vier Kennzahlen (EZ, KM, Kraftstoff, Getriebe), gestaltet wie eine
 * gestanzte Kfz-Plakette mit feinen Trennlinien und Mono-Ziffern - in
 * heller Ausfuehrung (Graphit-Relief auf Creme), damit sie sich nahtlos
 * in den einheitlich hellen Seitenhintergrund einfuegt.
 * Zieht sich durch Karte, Detailseite und Footer als Wiedererkennung.
 */
export default function SpecPlate({ vehicle, className }: Props) {
  const items = [
    { label: 'EZ', value: formatDate(vehicle.firstRegistration) },
    { label: 'KM', value: formatMileage(vehicle.mileageKm) },
    { label: 'Kraftstoff', value: fuelTypeLabels[vehicle.fuelType] },
    { label: 'Getriebe', value: transmissionLabels[vehicle.transmission] },
  ];

  return (
    <div className={clsx('spec-plate', className)} role="group" aria-label="Fahrzeug-Kenndaten">
      {items.map((item) => (
        <div key={item.label} className="spec-plate-cell">
          <span className="spec-plate-label">{item.label}</span>
          <span className="spec-plate-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
