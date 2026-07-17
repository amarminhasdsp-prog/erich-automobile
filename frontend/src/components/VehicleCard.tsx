import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import type { Vehicle } from '../types/vehicle';
import { buildPhotoUrl } from '../api/client';
import PhotoFallback from './PhotoFallback';
import StatusBadge from './StatusBadge';
import SpecPlate from './SpecPlate';
import { formatPrice } from '../utils/labels';
import { useReducedMotion } from '../hooks/useReducedMotion';

const TILT_RANGE_DEG = 8;
const TILT_SPRING = { stiffness: 150, damping: 15, mass: 0.5 };
const IMAGE_ZOOM_SCALE = 1.06;
const IMAGE_ZOOM_DURATION_S = 0.4;

interface Props {
  vehicle: Vehicle;
}

/**
 * Fahrzeug-Karte: Foto 16:10 mit Hover-Zoom, 3D-Tilt via useMotionValue
 * (Maus-Position -> Rotation), Status-Badge und die Typenschild-Leiste
 * als gravierte Plakette am Kartenfuss. Komplett klickbar.
 *
 * Der 3D-Tilt wird bei prefers-reduced-motion UND auf Touch-Geraeten
 * deaktiviert (kein "hover" via Finger, ausserdem verhindert das
 * Vermeiden von pointermove-Tilt Jank/Scroll-Konflikte auf Mobile).
 */
export default function VehicleCard({ vehicle }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mainPhoto = vehicle.photos.find((p) => p.isMain) ?? vehicle.photos[0];
  const isSold = vehicle.status === 'VERKAUFT';
  const prefersReducedMotion = useReducedMotion();
  const isTouchDevice =
    typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const disableTilt = prefersReducedMotion || isTouchDevice;

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [TILT_RANGE_DEG, -TILT_RANGE_DEG]), TILT_SPRING);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-TILT_RANGE_DEG, TILT_RANGE_DEG]), TILT_SPRING);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (disableTilt) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.set((e.clientX - rect.left) / rect.width);
    pointerY.set((e.clientY - rect.top) / rect.height);
  }

  function handlePointerLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return (
    <motion.div
      ref={cardRef}
      style={disableTilt ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="group [transform-style:preserve-3d]"
    >
      <Link
        to={`/fahrzeuge/${vehicle.id}`}
        className="block cursor-pointer overflow-hidden rounded-2xl border border-graphite-900/8 bg-white shadow-card transition-[border-color,box-shadow] duration-300 hover:border-brass/60 hover:shadow-lift"
        aria-label={`${vehicle.title} ansehen`}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-graphite-100">
          {mainPhoto ? (
            <motion.img
              src={buildPhotoUrl(mainPhoto.filename)}
              alt={`${vehicle.make} ${vehicle.model} ${vehicle.variant ?? ''}`.trim()}
              loading="lazy"
              className="h-full w-full object-cover"
              whileHover={{ scale: IMAGE_ZOOM_SCALE }}
              transition={{ duration: IMAGE_ZOOM_DURATION_S, ease: 'easeOut' }}
            />
          ) : (
            <PhotoFallback make={vehicle.make} model={vehicle.model} />
          )}

          <StatusBadge status={vehicle.status} className="absolute left-3 top-3" />

          {isSold && (
            <div className="absolute inset-0 flex items-center justify-center bg-graphite-900/45">
              <span className="-rotate-6 font-display text-2xl font-bold uppercase tracking-wide text-white">
                Verkauft
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 p-4">
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-graphite-900">
            {vehicle.title}
          </h3>

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-xl font-bold text-brass-dim">{formatPrice(vehicle.price)}</span>
            <span className="text-[11px] text-graphite-500">
              {vehicle.vatDeductible ? 'MwSt. ausweisbar' : 'MwSt. nicht ausweisbar'}
            </span>
          </div>

          <SpecPlate vehicle={vehicle} />
        </div>
      </Link>
    </motion.div>
  );
}
