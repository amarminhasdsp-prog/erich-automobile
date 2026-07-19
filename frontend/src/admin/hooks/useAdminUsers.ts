import { useCallback, useEffect, useState } from 'react';
import { listAdminUsers, type AdminUserWithTimestamps } from '../api/adminClient';

interface UseAdminUsersResult {
  users: AdminUserWithTimestamps[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Laedt alle Admin-Benutzer (nur fuer Rolle ADMIN erreichbar, siehe Backend-Route). */
export function useAdminUsers(): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUserWithTimestamps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listAdminUsers()
      .then((items) => {
        if (!cancelled) setUsers(items);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { users, isLoading, error, refetch };
}
