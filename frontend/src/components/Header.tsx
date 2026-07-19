import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import { UserFilledIcon, UserIcon } from './icons';
import { hasAdminSession } from '../admin/api/adminClient';
import { buildUploadUrl } from '../api/client';
import type { Dealer } from '../types/vehicle';

const NAV_LINKS = [
  { to: '/', label: 'Start' },
  { to: '/fahrzeuge', label: 'Fahrzeuge' },
  { to: '/leistungen', label: 'Leistungen' },
];

const MENU_SLIDE_DURATION_S = 0.28;

interface Props {
  dealer?: Dealer;
}

/**
 * Sticky Kopfleiste mit Erich-Automobile-Signet und Navigation - hell,
 * kein Dark-Mode-Toggle. Unter 768px klappt die Navigation zu einem
 * Hamburger-Icon zusammen; das Menue faehrt als Panel von rechts ein
 * (Framer Motion, respektiert prefers-reduced-motion) und schliesst sich
 * automatisch bei Routenwechsel.
 *
 * Logo: sobald der Haendler ein eigenes Bild-Logo hinterlegt hat
 * (dealer.logoFilename, siehe Backend /api/admin/dealers/:id/logo), wird
 * dieses statt des generierten SVG-Signets angezeigt (siehe Logo.tsx).
 */
export default function Header({ dealer }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => hasAdminSession());
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
    // sessionStorage-Flag neu lesen: deckt Login/Logout im Admin-Bereich ab,
    // ohne den oeffentlichen Header staendig zu pollen.
    setIsAdminLoggedIn(hasAdminSession());
  }, [location.pathname]);

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
    <>
    <header className="sticky top-0 z-30 border-b border-graphite-900/8 bg-cream/90 backdrop-blur-md">
      <div className="section-container flex items-center justify-between py-2.5">
        <NavLink to="/" className="cursor-pointer">
          <Logo withWordmark logoUrl={dealer?.logoFilename ? buildUploadUrl(dealer.logoFilename, 'logo') : undefined} />
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
    </header>

    {/*
      Mobiles Menue wird via Portal direkt in document.body gerendert statt
      innerhalb des <header>. Grund: <header> hat backdrop-blur-md, was einen
      CSS-Filter (filter/backdrop-filter) erzeugt - und JEDES Element mit
      einem aktiven filter bildet einen neuen "containing block" fuer alle
      Nachkommen mit position: fixed. Dadurch wurden inset-0/fixed-Kinder
      bisher relativ zur (nur 64px hohen) Kopfleiste statt zum Viewport
      positioniert und sind auf eine winzige Flaeche kollabiert - das war die
      Ursache des "transparenten, unlesbaren" Menues. Ausserhalb des
      gefilterten Ancestors verhaelt sich position: fixed wieder normal
      (relativ zum Viewport).
    */}
    {createPortal(
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MENU_SLIDE_DURATION_S }}
              className="fixed inset-0 z-40 bg-graphite-950/50 md:hidden"
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
              className="fixed inset-y-0 right-0 z-50 flex h-full w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto border-l border-graphite-900/10 bg-[#F5F3EE] p-4 pt-16 shadow-lift md:hidden"
            >
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Menü schließen"
                className="absolute right-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-graphite-900/8 text-graphite-900 transition-colors duration-200 hover:bg-brass/25"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>

              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex min-h-[48px] cursor-pointer items-center rounded-xl border-b border-graphite-900/10 px-4 text-base font-medium text-graphite-900 transition-colors duration-200 last:border-b-0 ${
                      isActive ? 'bg-brass text-graphite-950' : 'hover:bg-brass/20 hover:text-brass-dim'
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
                  `flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-b border-graphite-900/10 px-4 text-base font-medium text-graphite-900 transition-colors duration-200 last:border-b-0 ${
                    isActive ? 'bg-brass text-graphite-950' : 'hover:bg-brass/20 hover:text-brass-dim'
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
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
