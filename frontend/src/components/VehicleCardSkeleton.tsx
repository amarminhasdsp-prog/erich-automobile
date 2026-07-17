/** Schimmernde Platzhalterkarte fuer den Ladezustand des Fahrzeug-Grids. */
export default function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-graphite-900/8 bg-white" aria-hidden="true">
      <div className="shimmer aspect-[16/10] w-full" />
      <div className="flex flex-col gap-3 p-5">
        <div className="shimmer h-5 w-20 rounded-full" />
        <div className="shimmer h-5 w-4/5 rounded" />
        <div className="shimmer h-6 w-1/2 rounded" />
        <div className="shimmer mt-1 h-12 w-full rounded-md" />
      </div>
    </div>
  );
}
