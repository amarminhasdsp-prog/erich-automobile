import { Link } from 'react-router-dom';

/** 404-Seite im Typenschild-Stil der Marke. */
export default function NotFoundPage() {
  return (
    <div className="section-container flex flex-col items-center gap-4 py-24 text-center">
      <span className="font-mono text-6xl font-bold text-brass">404</span>
      <h1 className="font-display text-2xl font-semibold text-graphite-900">Seite nicht gefunden</h1>
      <p className="max-w-sm text-sm text-graphite-600">
        Die gesuchte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        to="/"
        className="mt-2 cursor-pointer rounded-full border border-brass px-5 py-2.5 text-sm font-semibold text-brass-dim transition-colors duration-200 hover:bg-brass hover:text-graphite-950"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
