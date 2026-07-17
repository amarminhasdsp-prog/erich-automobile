import { Link } from 'react-router-dom';
import { useAdminVehicles } from '../hooks/useAdminVehicles';
import { deleteAdminVehicle } from '../api/adminClient';
import StatusBadge from '../../components/StatusBadge';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { EditIcon, PlusIcon, TrashIcon } from '../../components/icons';
import { formatDate } from '../../utils/labels';

/** Admin-Dashboard: alle Inserate (inkl. Entwuerfe) als Tabelle mit Kernaktionen. */
export default function AdminDashboardPage() {
  const { vehicles, isLoading, error, refetch } = useAdminVehicles({ pageSize: 100 });

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`„${title}“ wirklich unwiderruflich loeschen?`)) return;
    try {
      await deleteAdminVehicle(id);
      refetch();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Loeschen fehlgeschlagen');
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Verwaltung</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-paper">Alle Inserate</h1>
        </div>
        <Link
          to="/admin/fahrzeuge/neu"
          className="flex cursor-pointer items-center gap-2 rounded-full bg-brass px-5 py-2.5 text-sm font-semibold text-graphite-950 transition-colors duration-200 hover:bg-brass-light"
        >
          <PlusIcon className="h-4 w-4" />
          Neues Inserat
        </Link>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!error && isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!error && !isLoading && vehicles.length === 0 && (
        <EmptyState
          title="Noch keine Inserate"
          message="Legen Sie Ihr erstes Fahrzeug-Inserat an, um es hier zu verwalten."
          actionLabel="Neues Inserat anlegen"
          onAction={() => (window.location.href = '/admin/fahrzeuge/neu')}
        />
      )}

      {!error && !isLoading && vehicles.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-graphite-700/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-graphite-700/60 bg-graphite-900/60 text-xs uppercase tracking-wide text-paper/50">
                <th scope="col" className="px-4 py-3 font-medium">
                  Titel
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Fotos
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Erstellt
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-right">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-700/40">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="bg-graphite-900/20 transition-colors duration-150 hover:bg-graphite-800/50">
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-paper">{vehicle.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={vehicle.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-paper/70">{vehicle.photos.length}</td>
                  <td className="px-4 py-3 font-mono text-paper/70">{formatDate(vehicle.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/fahrzeuge/${vehicle.id}`}
                        aria-label={`${vehicle.title} bearbeiten`}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-graphite-700 px-3 py-1.5 text-xs font-medium text-paper/85 transition-colors duration-200 hover:border-brass hover:text-brass"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        Bearbeiten
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(vehicle.id, vehicle.title)}
                        aria-label={`${vehicle.title} loeschen`}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-graphite-700 px-3 py-1.5 text-xs font-medium text-paper/85 transition-colors duration-200 hover:border-red-400/60 hover:text-red-300"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
