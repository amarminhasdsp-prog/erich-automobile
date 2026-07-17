import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import { UserFilledIcon, UserIcon } from './icons';
import { hasAdminSession } from '../admin/api/adminClient';

const NAV_LINKS = [
  { to: '/', label: 'Start' },
  { to: '/fahrzeuge', label: 'Fahrzeuge' },
  { to: '/leistungen', label: 'Leistungen' },
];

const MENU_SLIDE_DURATION_S = 0.28;

/**
 * Sticky Kopfleiste mit Erich-Automobile-Signet und Navigation - hell,
 * kein Dark-Mode-Toggle. Unter 768px klappt die Navigation zu einem
 * Hamburger-Icon zusammen; das Menue faehrt als Panel von rechts ein
 * (Framer Motion, respektiert prefers-reduced-motion) und schliesst sich
 * automatisch bei Routenwechsel.
 */
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [barHeight, setBarHeight] = useState(56);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => hasAdminSession());
  const barRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
    // sessionStorage-Flag neu lesen: deckt Login/Logout im Admin-Bereich ab,
    // ohne den oeffentlichen Header staendig zu pollen.
    setIsAdminLoggedIn(hasAdminSession());
  }, [location.pathname]);

  useEffect(() => {
    function measure() {
      if (barRef.current) setBarHeight(barRef.current.getBoundingClientRect().height);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive ? 'bg-brass text-graphite-950' : 'text-graphite-700 hover:bg-brass/15 hover:text-brass-dim'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-graphite-900/8 bg-cream/90 backdrop-blur-md">
      <div ref={barRef} className="section-container flex items-center justify-between py-2.5">
        <NavLink to="/" className="cursor-pointer">
          <Logo withWordmark />
        </NavLink>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to={isAdminLoggedIn ? '/admin' : '/admin/login'}
            aria-label="Verwaltungsbereich"
            title="Verwaltungsbereich"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-graphite-700 transition-colors duration-200 hover:bg-brass/15 hover:text-brass-dim"
          >
            {isAdminLoggedIn ? (
              <UserFilledIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <UserIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-panel"
          aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-graphite-900 transition-colors duration-200 hover:bg-brass/15 md:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {isMenuOpen ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MENU_SLIDE_DURATION_S }}
              style={{ top: barHeight }}
              className="fixed inset-x-0 bottom-0 z-20 bg-graphite-950/40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.nav
              id="mobile-nav-panel"
              key="panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: MENU_SLIDE_DURATION_S, ease: 'easeOut' }}
              aria-label="Hauptnavigation"
              style={{ top: barHeight }}
              className="fixed right-0 bottom-0 z-20 flex w-64 flex-col gap-1 border-l border-graphite-900/8 bg-white p-4 shadow-lift md:hidden"
            >
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex min-h-[44px] cursor-pointer items-center rounded-xl px-4 text-base font-medium transition-colors duration-200 ${
                      isActive ? 'bg-brass text-graphite-950' : 'text-graphite-700 hover:bg-brass/15 hover:text-brass-dim'
                    }`
                  }
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to={isAdminLoggedIn ? '/admin' : '/admin/login'}
                className={({ isActive }) =>
                  `flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-4 text-base font-medium transition-colors duration-200 ${
                    isActive ? 'bg-brass text-graphite-950' : 'text-graphite-700 hover:bg-brass/15 hover:text-brass-dim'
                  }`
                }
              >
                {isAdminLoggedIn ? (
                  <UserFilledIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <UserIcon className="h-5 w-5" aria-hidden="true" />
                )}
                Verwaltung
              </NavLink>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
