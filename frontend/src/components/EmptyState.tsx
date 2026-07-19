interface Props {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Gestaltete Empty-/Error-Illustration (CSS/SVG, keine Lottie-Abhaengigkeit
 * fuer diesen einfachen Zustand): stilisierter Kfz-Scheinwerfer mit
 * durchgestrichenem Suchglas, passend zur Typenschild-Bildsprache.
 */
export default function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-graphite-900/15 bg-white px-6 py-16 text-center">
      <svg
        width="96"
        height="72"
        viewBox="0 0 96 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-brass-dim"
      >
        <rect x="8" y="20" width="56" height="32" rx="6" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
        <circle cx="24" cy="36" r="7" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="44" cy="36" r="7" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="74" cy="36" r="14" stroke="currentColor" strokeWidth="1.6" opacity="0.8" />
        <line x1="83.5" y1="45.5" x2="92" y2="54" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="64" y1="26" x2="84" y2="46" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      </svg>
      <h3 className="font-display text-xl font-semibold text-graphite-900">{title}</h3>
      <p className="max-w-sm text-sm text-graphite-600">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 cursor-pointer rounded-full border border-brass px-5 py-2 text-sm font-semibold text-brass-dim transition-colors duration-200 hover:bg-brass hover:text-graphite-950"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
