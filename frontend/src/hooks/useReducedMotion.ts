import { useEffect, useState } from 'react';

// Respektiert prefers-reduced-motion global; Komponenten koennen darauf
// reagieren, um Motion-Distanzen/Dauern zu reduzieren statt Animationen
// hart zu deaktivieren (siehe frontend-design.md).
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}
