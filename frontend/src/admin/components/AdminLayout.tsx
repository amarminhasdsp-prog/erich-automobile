import { useState, useRef, useEffect } from 'react';
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuthContext } from '../context/AdminAuthContext';
import { LockIcon, LogOutIcon, UserFilledIcon } from '../../components/icons';

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  `cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
    isActive ? 'bg-brass text-graphite-950' : 'text-paper/85 hover:bg-brass/15 hover:text-brass'
  }`;

/**
 * Admin-Shell: eigener, klar erkennbarer Verwaltungsbereich-Header
 * (dunkler Grund, Warnschild-Ikonografie statt Marken-Logo) getrennt vom
 * oeffentlichen Header. Leitet nicht angemeldete Besucher zum Login um.
 * Der Nav-Punkt "Benutzer" ist nur fuer die Rolle ADMIN sichtbar; der
 * Nutzer-Chip rechts zeigt Name/Rolle und oeffnet ein Dropdown mit
 * Passwort-aendern und Abmelden.
 */
export default function AdminLayout() {
  const { isAuthenticated, user, logout } = useAdminAuthContext();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-graphite-950 text-paper">
      <header className="sticky top-0 z-30 border-b-2 border-brass bg-graphite-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brass bg-graphite-950">
              <LockIcon className="h-4 w-4 text-brass" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold text-paper">Verwaltungsbereich</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
                Erich Automobile — Admin
              </span>
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/admin" end className={NAV_LINK_CLASS}>
              Inserate
            </NavLink>
            <NavLink to="/admin/fahrzeuge/neu" className={NAV_LINK_CLASS}>
              Neues Inserat
            </NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin/benutzer" className={NAV_LINK_CLASS}>
                Benutzer
              </NavLink>
            )}
            <a
              href="/"
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-paper/60 transition-colors duration-200 hover:text-brass"
            >
              Zur Website
            </a>

            <div ref={menuRef} className="relative ml-1">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-graphite-700 px-3 py-2 text-sm font-medium text-paper/85 transition-colors duration-200 hover:border-brass hover:text-brass"
              >
                <UserFilledIcon className="h-4 w-4 text-brass" />
                <span className="max-w-[10rem] truncate">{user?.name ?? user?.email}</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-56 rounded-xl border border-graphite-700/60 bg-graphite-900 py-1.5 shadow-lift"
                >
                  <div className="border-b border-graphite-700/60 px-4 py-2.5">
                    <p className="truncate text-sm font-medium text-paper">{user?.name}</p>
                    <p className="truncate text-xs text-paper/50">{user?.email}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-brass">
                      {user?.role === 'ADMIN' ? 'Administrator' : 'Redakteur'}
                    </p>
                  </div>
                  <NavLink
                    to="/admin/passwort"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block cursor-pointer px-4 py-2 text-sm text-paper/85 transition-colors duration-200 hover:bg-brass/15 hover:text-brass"
                  >
                    Passwort ändern
                  </NavLink>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-1.5 px-4 py-2 text-left text-sm text-paper/85 transition-colors duration-200 hover:bg-red-400/10 hover:text-red-300"
                  >
                    <LogOutIcon className="h-3.5 w-3.5" />
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
