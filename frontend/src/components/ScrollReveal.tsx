import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REVEAL_DISTANCE_PX = 40;
const REVEAL_DURATION_S = 0.7;
const REVEAL_STAGGER_S = 0.08;

interface Props {
  children: React.ReactNode;
  className?: string;
  /** CSS-Selektor fuer die direkten Kinder, die staggered einfliegen sollen. */
  itemSelector?: string;
}

/**
 * Sektions-Reveal via GSAP ScrollTrigger: Kinder faden gestaffelt von unten
 * ein, sobald die Sektion in den Viewport scrollt. Respektiert
 * prefers-reduced-motion vollstaendig.
 */
export default function ScrollReveal({ children, className, itemSelector = ':scope > *' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    const items = containerRef.current.querySelectorAll(itemSelector);
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(items, { opacity: 0, y: REVEAL_DISTANCE_PX });
      ScrollTrigger.batch(items, {
        start: 'top 85%',
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: REVEAL_DURATION_S,
            stagger: REVEAL_STAGGER_S,
            ease: 'power3.out',
          }),
        once: true,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [itemSelector]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
