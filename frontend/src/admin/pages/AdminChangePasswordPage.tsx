import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { changeOwnPassword, ApiRequestError } from '../api/adminClient';
import { KeyIcon } from '../../components/icons';

const PASSWORD_HINT = 'Mindestens 12 Zeichen, mit Buchstaben und Ziffern.';

/** Eigenstaendige Seite (statt Dialog) zum Aendern des eigenen Passworts, erreichbar ueber das Nutzer-Dropdown. */
export default function AdminChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }

    setIsSubmitting(true);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Passwort ändern fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Konto</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-paper">Passwort ändern</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="rounded-2xl border border-graphite-700/60 bg-graphite-900/60 p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brass">
            <KeyIcon className="h-4 w-4 text-brass" />
          </span>
          <p className="text-sm text-paper/60">Aktuelles Passwort zur Bestätigung erforderlich.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="current-password" className="mb-1.5 block text-xs font-medium text-paper/70">
              Aktuelles Passwort
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-3 text-sm text-paper transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-paper/70">
              Neues Passwort
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-3 text-sm text-paper transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            />
            <p className="mt-1 text-xs text-paper/40">{PASSWORD_HINT}</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-paper/70">
              Neues Passwort bestätigen
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-3 text-sm text-paper transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-300">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-sm font-medium text-racing">
              Passwort erfolgreich geändert.
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="cursor-pointer rounded-xl border border-graphite-700 px-5 py-3 text-sm font-medium text-paper/85 transition-colors duration-200 hover:border-paper/40"
            >
              Zurück
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl bg-brass px-5 py-3 text-sm font-semibold text-graphite-950 transition-colors duration-200 hover:bg-brass-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Speichern…' : 'Passwort ändern'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
