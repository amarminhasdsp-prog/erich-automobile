import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthContext } from '../context/AdminAuthContext';
import type { AdminRole } from '../api/adminClient';

/**
 * Zusaetzlicher Client-Guard fuer rollenbeschraenkte Admin-Routen (z.B.
 * Benutzerverwaltung nur fuer ADMIN). Dies ist Komfort/UX (sofortiges
 * Redirect statt eines 403 vom Server) - die eigentliche Zugriffskontrolle
 * erzwingt weiterhin das Backend (requireRole('ADMIN')).
 */
export default function RequireAdminRole({ allowedRoles }: { allowedRoles: AdminRole[] }) {
  const { user } = useAdminAuthContext();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
