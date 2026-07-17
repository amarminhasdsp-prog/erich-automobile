import { CalendarIcon, FuelIcon, GaugeIcon, TransmissionIcon } from './icons';

interface Props {
  registration: string;
  mileage: string;
  fuel: string;
  transmission: string;
  size?: 'sm' | 'lg';
}

// Signature-Element: Digitaltacho-Leiste. Ersetzt/entwickelt die "Typenschild-
// Plakette" des Referenzprojekts weiter zu einer Instrumenten-Cluster-Aesthetik -
// in heller Ausfuehrung (Graphit-Relief auf Creme statt dunkler Flaeche), damit
// kein Kontrastbruch zum Rest der Seite entsteht.
export default function GaugeStrip({ registration, mileage, fuel, transmission, size = 'sm' }: Props) {
  const items = [
    { icon: CalendarIcon, label: 'EZ', value: registration },
    { icon: GaugeIcon, label: 'KM', value: mileage },
    { icon: FuelIcon, label: 'Kraftstoff', value: fuel },
    { icon: TransmissionIcon, label: 'Getriebe', value: transmission },
  ];

  const padding = size === 'lg' ? 'px-4 py-3' : 'px-3 py-2.5';
  const valueSize = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div
      className={`gauge-strip grid grid-cols-4 divide-x divide-brass/25 rounded-b-xl border border-t-0 border-graphite-900/8 bg-graphite-900/[0.04] ${padding}`}
      role="group"
      aria-label="Technische Kennzahlen"
    >
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex flex-col items-center gap-1 px-1 text-center">
          <Icon className="h-3.5 w-3.5 text-brass-dim/70" aria-hidden="true" />
          <span className={`font-mono font-medium tracking-tight text-graphite-900 ${valueSize}`}>{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-graphite-900/40">{label}</span>
        </div>
      ))}
    </div>
  );
}
