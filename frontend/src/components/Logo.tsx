import { useState } from 'react';

interface Props {
  className?: string;
  /** Zeigt den zweizeiligen Firmennamen neben dem Signet (Header). */
  withWordmark?: boolean;
  /**
   * URL zu einem hochgeladenen Haendler-Bild-Logo (siehe Backend
   * /api/admin/dealers/:id/logo). Wenn gesetzt, wird dieses Bild statt des
   * generierten SVG-Signets angezeigt. Schlaegt das Laden fehl (404,
   * Netzwerkfehler), faellt die Komponente automatisch auf das SVG zurueck.
   */
  logoUrl?: string;
}

/**
 * Erich-Automobile-Signet (verfeinerte Fassung): schlanke Linien-Silhouette
 * des Stuttgarter Fernsehturms ueber einer minimalistischen Luxury-Sedan-
 * Kontur, unterlegt von feinen konzentrischen Bogenlinien die nach aussen
 * heller/duenner auslaufen (letzte Linie in Gold als Akzent). Durchgaengig
 * duenne, gleichmaessige Konturen (0.9-1.5px) statt gefuellter Flaechen -
 * fuer einen klaren, premium-anmutenden Auftritt statt eines cartoonhaften
 * Signets.
 *
 * Sobald ein echtes Haendler-Logo hochgeladen wurde (logoUrl gesetzt und
 * ladbar), wird dieses Bild anstelle des generierten SVG angezeigt.
 */
export default function Logo({ className = '', withWordmark = false, logoUrl }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !imageFailed;

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {showImage ? (
        <img
          src={logoUrl}
          alt="Erich Automobile Logo"
          width={36}
          height={36}
          className="h-9 w-9 flex-shrink-0 object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <svg
        width="36"
        height="36"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="flex-shrink-0"
      >
        <circle cx="24" cy="24" r="23" fill="#FFFFFF" stroke="#2A2A2A" strokeWidth="1" />

        {/* Fernsehturm: schlanker Schaft, offener Aussichtsring, feine Antenne */}
        <g stroke="#2A2A2A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M22.4 33.5l1.6-19.5 1.6 19.5" />
          <ellipse cx="24" cy="15.8" rx="3.4" ry="2.4" />
          <path d="M24 13.2V7.6" />
          <circle cx="24" cy="6.5" r="0.9" fill="#2A2A2A" stroke="none" />
        </g>

        {/* Auto-Silhouette: eine durchgehende Luxury-Sedan-Kontur, nur Stroke */}
        <path
          d="M8.8 34.2c0.3-1.6 1.3-2.9 2.9-3.3 1.7-0.45 3-1.6 4.1-2.9 1.15-1.35 2.6-2.05 4.4-2.05h7.6c1.75 0 3.2 0.7 4.35 2.05 1.1 1.3 2.4 2.45 4.1 2.9 1.6 0.4 2.6 1.7 2.9 3.3"
          stroke="#2A2A2A"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.8 34.2h30.4"
          stroke="#2A2A2A"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="14.6" cy="34.2" r="1.7" stroke="#2A2A2A" strokeWidth="1" />
        <circle cx="33.4" cy="34.2" r="1.7" stroke="#2A2A2A" strokeWidth="1" />

        {/* Konzentrische Bogenlinien statt Balken: laufen nach aussen heller/duenner aus, aeusserster Bogen in Gold */}
        <path d="M11 39.4a13 13 0 0 1 26 0" stroke="#2A2A2A" strokeWidth="1" opacity="0.9" />
        <path d="M8.5 41.2a15.5 15.5 0 0 1 31 0" stroke="#4A5361" strokeWidth="0.85" opacity="0.65" />
        <path d="M6 43a18 18 0 0 1 36 0" stroke="#C9A24B" strokeWidth="0.75" opacity="0.8" />
        </svg>
      )}

      {withWordmark && (
        <span className="leading-tight">
          <span
            className="block font-body text-[15px] font-medium uppercase text-[#2A2A2A]"
            style={{ letterSpacing: '0.18em' }}
          >
            Erich Automobile
          </span>
          <span
            className="block font-body text-[10px] font-light uppercase text-[#C9A24B]"
            style={{ letterSpacing: '0.32em' }}
          >
            Stuttgart
          </span>
        </span>
      )}
    </span>
  );
}
