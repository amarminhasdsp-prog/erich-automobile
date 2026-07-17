import { createContext, useContext, type ReactNode } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import type { AdminUser } from '../api/adminClient';

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isSubmitting: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * Stellt den Admin-Auth-Zustand (inkl. Nutzerobjekt fuer Header/Rollen-Nav)
 * einmalig fuer den gesamten Admin-Teilbaum bereit, statt dass jede
 * Komponente ihren eigenen useAdminAuth-State haelt (der sonst bei Login/
 * Logout nicht zwischen Login-Seite, Header und Nav synchron waere).
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const auth = useAdminAuth();
  return <AdminAuthContext.Provider value={auth}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuthContext(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuthContext muss innerhalb von <AdminAuthProvider> verwendet werden');
  }
  return ctx;
}
