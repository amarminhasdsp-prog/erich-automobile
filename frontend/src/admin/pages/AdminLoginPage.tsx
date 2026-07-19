import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminAuthContext } from '../context/AdminAuthContext';
import { LockIcon } from '../../components/icons';

/** Login-Seite fuer den Verwaltungsbereich: E-Mail + Passwort gegen die AdminUser-Tabelle. */
export default function AdminLoginPage() {
  const { isAuthenticated, isSubmitting, error, login } = useAdminAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin';
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/admin', { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-2xl border border-graphite-700/60 bg-graphite-900/80 p-8 shadow-lift"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-brass">
            <LockIcon className="h-5 w-5 text-brass" />
          </span>
          <h1 className="font-display text-xl font-semibold text-paper">Verwaltungsbereich</h1>
          <p className="text-sm text-paper/60">Bitte mit E-Mail und Passwort anmelden.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-xs font-medium text-paper/70">
              E-Mail
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@erich-automobile.de"
              className="w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-3 text-sm text-paper placeholder:text-paper/40 transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-xs font-medium text-paper/70">
              Passwort
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full cursor-text rounded-lg border border-graphite-700 bg-graphite-800 px-4 py-3 text-sm text-paper placeholder:text-paper/40 transition-colors duration-200 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || email.length === 0 || password.length === 0}
            className="cursor-pointer rounded-xl bg-brass px-5 py-3 text-sm font-semibold text-graphite-950 transition-colors duration-200 hover:bg-brass-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
