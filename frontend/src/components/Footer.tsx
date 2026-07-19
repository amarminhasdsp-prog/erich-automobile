import type { Dealer } from '../types/vehicle';
import Logo from './Logo';

interface Props {
  dealer?: Dealer;
}

/** Footer mit Haendler-Kontaktdaten, Adresse, Website und mobile.de-Trust-Signal. */
export default function Footer({ dealer }: Props) {
  return (
    <footer className="mt-10 border-t border-graphite-900/8 bg-white">
      <div className="section-container flex flex-col gap-6 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Logo withWordmark />
          <p className="mt-3 text-sm leading-relaxed text-graphite-600">
            Weil der Fahrzeugkauf Vertrauenssache ist — kuratierte Fahrzeuge, transparente Angebote und
            persönliche Beratung aus einer Hand.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-brass-dim">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L12 2z"
                fill="currentColor"
              />
            </svg>
            Bei mobile.de seit 10 Jahren
          </span>
        </div>

        <div className="max-w-xs text-sm text-graphite-600">
          <span className="block font-display text-base font-semibold text-graphite-900">
            {dealer?.companyName ?? 'Erich Automobile Stuttgart'}
          </span>
          <address className="mt-1.5 not-italic leading-relaxed">
            {dealer?.street ?? 'Sigmaringer Str. 205'}
            <br />
            {dealer?.postalCode ?? '70567'} {dealer?.city ?? 'Stuttgart-Degerloch'}
          </address>
          {dealer?.phone && <p className="mt-1.5">{dealer.phone}</p>}
          {dealer?.email && (
            <p className="mt-1">
              <a href={`mailto:${dealer.email}`} className="cursor-pointer hover:text-brass-dim">
                {dealer.email}
              </a>
            </p>
          )}
          <p className="mt-1">
            <a
              href="https://erich-automobile.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-brass-dim"
            >
              erich-automobile.de
            </a>
          </p>
        </div>
      </div>
      <div className="section-container border-t border-graphite-900/8 py-3 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-graphite-500">
        © {new Date().getFullYear()} Erich Automobile Stuttgart — Alle Fahrzeuge vorbehaltlich Zwischenverkauf
      </div>
    </footer>
  );
}
