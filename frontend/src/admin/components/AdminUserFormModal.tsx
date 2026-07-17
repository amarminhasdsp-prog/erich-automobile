import { useEffect, useRef, useState } from 'react';
import type { AdminRole, AdminUserWithTimestamps } from '../api/adminClient';
import { XIcon } from '../../components/icons';

export interface AdminUserFormValues {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}

interface Props {
  /** Wenn gesetzt: Bearbeiten-Modus (Passwort optional leer lassen = unveraendert). */
  editingUser: AdminUserWithTimestamps | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: AdminUserFormValues) => void;
  onClose: () => void;
}

const PASSWORD_HINT = 'Mindestens 12 Zeichen, mit Buchstaben und Ziffern.';

/** Modal-Formular zum Anlegen/Bearbeiten eines Admin-Benutzers. Fokus-Trap + Escape-to-close. */
export default function AdminUserFormModal({ editingUser, isSubmitting, error, onSubmit, onClose }: Props) {
  const [email, setEmail] = useState(editingUser?.email ?? '');
  const [name, setName] = useState(editingUser?.name ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>(editingUser?.role ?? 'EDITOR');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const isEditing = editingUser !== null;

  useEffect(() => {
    firstFieldRef.current?.focus();
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ email, name, password, role });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-graphite-950/70 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-form-title"
        className="w-full max-w-md rounded-2xl border border-graphite-700/60 bg-graphite-900 p-6 shadow-lift"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="admin-user-form-title" className="font-display text-lg font-semibold text-paper">
            {isEditing ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Formular schliessen"
            className="cursor-pointer rounded-full p-1.5 text-paper/60 transition-colors duration-200 hover:bg-graphite-800 hover:text-paper"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="user-email" className="mb-1.5 block text-xs font-medium text-paper/70">
              E-Mail
            </label>
            <input
              ref={firstFieldRef}
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@erich-automobile.de"
              className="w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-2.5 text-sm text-paper placeholder:text-paper/40 transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label htmlFor="user-name" className="mb-1.5 block text-xs font-medium text-paper/70">
              Name
            </label>
            <input
              id="user-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vor- und Nachname"
              className="w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-2.5 text-sm text-paper placeholder:text-paper/40 transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label htmlFor="user-password" className="mb-1.5 block text-xs font-medium text-paper/70">
              {isEditing ? 'Neues Passwort (optional)' : 'Passwort'}
            </label>
            <input
              id="user-password"
              type="password"
              autoComplete="new-password"
              required={!isEditing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? 'Leer lassen = unveraendert' : 'Passwort vergeben'}
              className="w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-2.5 text-sm text-paper placeholder:text-paper/40 transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            />
            <p className="mt-1 text-xs text-paper/40">{PASSWORD_HINT}</p>
          </div>

          <div>
            <label htmlFor="user-role" className="mb-1.5 block text-xs font-medium text-paper/70">
              Rolle
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full cursor-pointer rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-2.5 text-sm text-paper transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            >
              <option value="EDITOR">Redakteur (Fahrzeuge, Fotos, Dokumente)</option>
              <option value="ADMIN">Administrator (zusätzlich Benutzerverwaltung)</option>
            </select>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-300">
              {error}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-graphite-700 px-5 py-2.5 text-sm font-medium text-paper/85 transition-colors duration-200 hover:border-paper/40"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl bg-brass px-5 py-2.5 text-sm font-semibold text-graphite-950 transition-colors duration-200 hover:bg-brass-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
