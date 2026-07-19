import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { buildPhotoUrl } from '../api/client';
import type { Vehicle } from '../types/vehicle';

gsap.registerPlugin(ScrollTrigger, SplitText);

const QUICK_FILTERS: { label: string; params: Record<string, string> }[] = [
  { label: 'Elektro', params: { fuelType: 'ELEKTRO' } },
  { label: 'Automatik', params: { transmission: 'AUTOMATIK' } },
  { label: 'Unter 30.000 €', params: { maxPrice: '3000000' } },
];

const SPLIT_STAGGER_S = 0.02;
const SPLIT_DURATION_S = 0.7;

interface Props {
  featuredVehicle?: Vehicle;
}

/**
 * Heller Hero (kein dunkler Overlay/Backdrop mehr): Zweispaltiges Layout,
 * Headline + Suche links mit SplitText-Zeichenanimation, freigestelltes
 * Fahrzeugfoto rechts in heller Bildkarte. Fullscreen-Parallax entfaellt
 * bewusst, da kein Vollflaechen-Hintergrundfoto mehr existiert.
 */
export default function Hero({ featuredVehicle }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (headlineRef.current) {
        const split = new SplitText(headlineRef.current, { type: 'chars, words' });
        gsap.set(split.chars, { opacity: 0, y: prefersReducedMotion ? 0 : 24 });
        gsap.to(split.chars, {
          opacity: 1,
          y: 0,
          duration: SPLIT_DURATION_S,
          stagger: SPLIT_STAGGER_S,
          ease: 'power3.out',
          delay: 0.15,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/fahrzeuge${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  }

  function handleQuickFilter(params: Record<string, string>) {
    const search = new URLSearchParams(params).toString();
    navigate(`/fahrzeuge?${search}`);
  }

  const backdropUrl = featuredVehicle?.photos.find((p) => p.isMain)?.filename ?? featuredVehicle?.photos[0]?.filename;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-cream">
      <div className="section-container grid grid-cols-1 items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-16">
        <div ref={contentRef} className="relative z-10 text-center lg:text-left">
          {featuredVehicle && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-brass-dim"
            >
              Im Fokus: {featuredVehicle.make} {featuredVehicle.model}
            </motion.p>
          )}

          <h1
            ref={headlineRef}
            className="mx-auto max-w-xl font-display text-2xl font-semibold leading-tight text-graphite-900 sm:text-4xl lg:mx-0 lg:text-5xl"
          >
            Weil der Fahrzeugkauf Vertrauenssache ist.
          </h1>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            onSubmit={handleSearch}
            className="mx-auto mt-6 flex w-full max-w-xl items-center gap-2 rounded-2xl border border-graphite-900/8 bg-white p-2 shadow-card lg:mx-0"
            role="search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="ml-3 flex-shrink-0 text-graphite-600"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <line x1="16.2" y1="16.2" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <label htmlFor="hero-search" className="sr-only">
              Marke, Modell oder Freitext suchen
            </label>
            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Marke, Modell oder Stichwort — z. B. „Porsche 911“"
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-graphite-900 placeholder:text-graphite-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex-shrink-0 cursor-pointer rounded-xl bg-brass px-6 py-3 text-sm font-semibold text-graphite-950 transition-colors duration-200 hover:bg-brass-light"
            >
              Suchen
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-4 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start"
          >
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => handleQuickFilter(filter.params)}
                className="flex min-h-[44px] cursor-pointer items-center rounded-full border border-graphite-900/12 bg-white px-4 py-2 text-sm font-medium text-graphite-700 transition-colors duration-200 hover:border-brass hover:bg-brass/10 hover:text-brass-dim"
              >
                {filter.label}
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          ref={backdropRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="group relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border border-graphite-900/8 bg-graphite-100 shadow-card transition-shadow duration-300 hover:shadow-lift"
        >
          {backdropUrl ? (
            <motion.img
              src={buildPhotoUrl(backdropUrl)}
              alt={featuredVehicle ? `${featuredVehicle.make} ${featuredVehicle.model}` : ''}
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          ) : (
            <div className="h-full w-full bg-graphite-100" />
          )}
        </motion.div>
      </div>
    </section>
  );
}
