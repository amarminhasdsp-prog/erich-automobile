import { useState } from 'react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminAuthContext } from '../context/AdminAuthContext';
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
  ApiRequestError,
  type AdminUserWithTimestamps,
} from '../api/adminClient';
import AdminUserFormModal, { type AdminUserFormValues } from '../components/AdminUserFormModal';
import RoleBadge from '../components/RoleBadge';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { EditIcon, PlusIcon, TrashIcon } from '../../components/icons';
import { formatDate } from '../../utils/labels';

/**
 * Benutzerverwaltung: nur ueber die Nav erreichbar, wenn role === 'ADMIN'
 * (siehe AdminLayout). Das Backend erzwingt dieselbe Einschraenkung
 * serverseitig (requireRole('ADMIN')) - diese Seite ist also defense-in-depth,
 * keine alleinige Zugriffskontrolle.
 */
export default function AdminUsersPage() {
  const { users, isLoading, error, refetch } = useAdminUsers();
  const { user: currentUser } = useAdminAuthContext();
  const [editingUser, setEditingUser] = useState<AdminUserWithTimestamps | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreateForm() {
    setEditingUser(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(u: AdminUserWithTimestamps) {
    setEditingUser(u);
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setFormError(null);
  }

  async function handleSubmit(values: AdminUserFormValues) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingUser) {
        const payload: Partial<AdminUserFormValues> = {
          email: values.email,
          name: values.name,
          role: values.role,
        };
        if (values.password) payload.password = values.password;
        await updateAdminUser(editingUser.id, payload);
      } else {
        await createAdminUser(values);
      }
      setShowForm(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(u: AdminUserWithTimestamps) {
    if (!window.confirm(`Benutzer „${u.name}“ (${u.email}) wirklich unwiderruflich löschen?`)) return;
    try {
      await deleteAdminUser(u.id);
      refetch();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Verwaltung</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-paper">Benutzer</h1>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-brass px-5 py-2.5 text-sm font-semibold text-graphite-950 transition-colors duration-200 hover:bg-brass-light"
        >
          <PlusIcon className="h-4 w-4" />
          Neuer Benutzer
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!error && isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!error && !isLoading && users.length === 0 && (
        <EmptyState
          title="Noch keine Benutzer"
          message="Legen Sie den ersten Zugang für Ihr Team an."
          actionLabel="Neuer Benutzer"
          onAction={openCreateForm}
        />
      )}

      {!error && !isLoading && users.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-graphite-700/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-graphite-700/60 bg-graphite-900/60 text-xs uppercase tracking-wide text-paper/50">
                <th scope="col" className="px-4 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  E-Mail
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Rolle
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
              {users.map((u) => (
                <tr key={u.id} className="bg-graphite-900/20 transition-colors duration-150 hover:bg-graphite-800/50">
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-paper">
                    {u.name}
                    {u.id === currentUser?.id && <span className="ml-2 text-xs text-paper/40">(Sie)</span>}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-paper/70">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 font-mono text-paper/70">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(u)}
                        aria-label={`${u.name} bearbeiten`}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-graphite-700 px-3 py-1.5 text-xs font-medium text-paper/85 transition-colors duration-200 hover:border-brass hover:text-brass"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser?.id}
                        aria-label={`${u.name} löschen`}
                        title={u.id === currentUser?.id ? 'Der eigene Account kann nicht gelöscht werden' : undefined}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-graphite-700 px-3 py-1.5 text-xs font-medium text-paper/85 transition-colors duration-200 hover:border-red-400/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-graphite-700 disabled:hover:text-paper/85"
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

      {showForm && (
        <AdminUserFormModal
          editingUser={editingUser}
          isSubmitting={isSubmitting}
          error={formError}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
