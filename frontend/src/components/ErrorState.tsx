interface Props {
  message: string;
  onRetry?: () => void;
}

/** Fehlerzustand: erklaert was schiefging und bietet einen Weg weiter. */
export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-crimson/25 bg-crimson-bg px-6 py-14 text-center"
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-crimson">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
        <line x1="12" y1="7.5" x2="12" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="16.3" r="0.9" fill="currentColor" />
      </svg>
      <p className="max-w-sm text-sm font-medium text-crimson">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer rounded-full border border-crimson/40 px-5 py-2 text-sm font-semibold text-crimson transition-colors duration-200 hover:bg-crimson/10"
        >
          Erneut versuchen
        </button>
      )}
    </div>
  );
}
