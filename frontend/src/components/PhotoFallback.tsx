import { CarIcon } from './icons';

interface Props {
  make: string;
  model: string;
  className?: string;
}

// Gestaltete Platte statt grauer Flaeche, falls ein Fahrzeug kein Foto hat.
// Helle Creme-Flaeche mit Marken-Monogramm in Fraunces und feinem
// Gold-Rahmen als Tacho-Anleihe - passend zum einheitlich hellen Theme.
export default function PhotoFallback({ make, model, className = '' }: Props) {
  const monogram = make.slice(0, 1).toUpperCase();
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-graphite-100 text-graphite-900 ${className}`}
      role="img"
      aria-label={`Kein Foto verfuegbar fuer ${make} ${model}`}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-brass/50 bg-white">
        <span className="font-display text-2xl font-semibold text-brass-dim">{monogram}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-graphite-600">
        <CarIcon className="h-3.5 w-3.5" />
        <span>Foto folgt</span>
      </div>
    </div>
  );
}
