import { useCallback, useState } from 'react';
import {
  adminLogin,
  adminLogout,
  clearAdminSessionFlag,
  getStoredAdminUser,
  hasAdminSession,
  type AdminUser,
} from '../api/adminClient';

interface UseAdminAuthResult {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isSubmitting: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

/**
 * Haelt den Admin-Login-Zustand samt oeffentlichen Nutzerdaten (Name, E-Mail,
 * Rolle). Das eigentliche JWT liegt in einem httpOnly-Cookie (vom Server
 * verwaltet, per JavaScript nicht lesbar) - hier wird nur das User-Objekt aus
 * der Login-Antwort (kein Secret) in sessionStorage gehalten, damit Header/Nav
 * nach einem Reload sofort Name und Rolle kennen, ohne auf einen eigenen
 * GET /me-Endpoint angewiesen zu sein (den es im Backend bewusst nicht gibt).
 */
export function useAdminAuth(): UseAdminAuthResult {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredAdminUser());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const loggedInUser = await adminLogin(email, password);
      setUser(loggedInUser);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen');
      setUser(null);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminLogout();
    } catch {
      // Cookie serverseitig loeschen ist best-effort: lokal wird der
      // Zustand in jedem Fall zurueckgesetzt, damit Abmelden nie haengen bleibt.
      clearAdminSessionFlag();
    } finally {
      setUser(null);
    }
  }, []);

  return { isAuthenticated: user !== null || hasAdminSession(), user, isSubmitting, error, login, logout };
}
