import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useVehicle } from '../hooks/useVehicle';
import { buildPhotoUrl } from '../api/client';
import PhotoFallback from '../components/PhotoFallback';
import StatusBadge from '../components/StatusBadge';
import SpecPlate from '../components/SpecPlate';
import ErrorState from '../components/ErrorState';
import {
  formatPrice,
  formatPower,
  categoryLabels,
  conditionLabels,
} from '../utils/labels';

const CROSSFADE_DURATION_S = 0.32;
const CROSSFADE_SCALE_START = 1.03;
// Ab dieser Drag-Distanz (px) oder Wischgeschwindigkeit gilt die Geste als
// Wechsel zum naechsten/vorherigen Foto statt als abgebrochener Drag.
const SWIPE_DISTANCE_THRESHOLD_PX = 60;
const SWIPE_VELOCITY_THRESHOLD = 400;

/** Detailseite: grosse Galerie mit Crossfade, sticky Preisbox mit CTA. */
export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { vehicle, isLoading, error } = useVehicle(id);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (isLoading) {
    return (
      <div className="section-container py-6">
        <div className="shimmer aspect-[4/3] w-full rounded-2xl sm:aspect-[21/9]" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="section-container py-6">
        <ErrorState message={error ?? 'Fahrzeug nicht gefunden.'} />
      </div>
    );
  }

  const photos = vehicle.photos;
  const activePhoto = photos[activePhotoIdx] ?? photos[0];
  const features = vehicle.features?.split(',').map((f) => f.trim()).filter(Boolean) ?? [];

  function goToPhoto(delta: number) {
    if (photos.length <= 1) return;
    setActivePhotoIdx((idx) => (idx + delta + photos.length) % photos.length);
  }

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.x <= -SWIPE_DISTANCE_THRESHOLD_PX || info.velocity.x <= -SWIPE_VELOCITY_THRESHOLD) {
      goToPhoto(1);
    } else if (info.offset.x >= SWIPE_DISTANCE_THRESHOLD_PX || info.velocity.x >= SWIPE_VELOCITY_THRESHOLD) {
      goToPhoto(-1);
    }
  }

  return (
    <div className="section-container py-6">
      <Link
        to="/fahrzeuge"
        className="mb-4 inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm font-medium text-graphite-600 transition-colors duration-200 hover:text-brass-dim"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Zurück zur Übersicht
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl border border-graphite-900/8 bg-white sm:aspect-[21/9]">
            <AnimatePresence mode="wait">
              {activePhoto ? (
                <motion.img
                  key={activePhoto.id}
                  src={buildPhotoUrl(activePhoto.filename)}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  initial={{ opacity: 0, scale: CROSSFADE_SCALE_START }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: CROSSFADE_SCALE_START }}
                  transition={{ duration: CROSSFADE_DURATION_S, ease: 'easeOut' }}
                  drag={photos.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className={`absolute inset-0 h-full w-full object-cover ${
                    photos.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                  }`}
                />
              ) : (
                <PhotoFallback make={vehicle.make} model={vehicle.model} />
              )}
            </AnimatePresence>
            <StatusBadge status={vehicle.status} className="absolute left-4 top-4" />

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToPhoto(-1)}
                  aria-label="Vorheriges Foto"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-graphite-900/10 bg-white/90 text-graphite-900 backdrop-blur-sm transition-colors duration-200 hover:bg-brass hover:text-graphite-950"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => goToPhoto(1)}
                  aria-label="Nächstes Foto"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-graphite-900/10 bg-white/90 text-graphite-900 backdrop-blur-sm transition-colors duration-200 hover:bg-brass hover:text-graphite-950"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="absolute bottom-3 right-4 rounded-full border border-graphite-900/10 bg-white/90 px-3 py-1 font-mono text-[11px] text-graphite-700 backdrop-blur-sm">
                  {activePhotoIdx + 1} / {photos.length} · zum Wischen ziehen
                </span>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Fotoauswahl">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  role="tab"
                  onClick={() => setActivePhotoIdx(idx)}
                  aria-label={`Foto ${idx + 1} von ${photos.length} anzeigen`}
                  aria-selected={idx === activePhotoIdx}
                  className={`h-16 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors duration-200 ${
                    idx === activePhotoIdx ? 'border-brass' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={buildPhotoUrl(photo.filename)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <h1 className="mt-5 font-display text-xl font-semibold text-graphite-900 sm:text-2xl lg:text-3xl">
            {vehicle.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-graphite-600">
            {vehicle.description}
          </p>

          <div className="mt-5">
            <SpecPlate vehicle={vehicle} className="max-w-xl" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-graphite-900">
                Technische Daten
              </h2>
              <dl className="mt-2 divide-y divide-graphite-900/8 text-sm">
                {[
                  ['Kategorie', categoryLabels[vehicle.category]],
                  ['Zustand', conditionLabels[vehicle.condition]],
                  ['Leistung', formatPower(vehicle.powerKw, vehicle.powerHp)],
                  ['Hubraum', vehicle.cubicCapacity ? `${vehicle.cubicCapacity} ccm` : '—'],
                  ['Farbe außen', vehicle.exteriorColor ?? '—'],
                  ['Vorbesitzer', vehicle.previousOwners?.toString() ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2">
                    <dt className="text-graphite-500">{label}</dt>
                    <dd className="font-mono font-medium text-graphite-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {features.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold text-graphite-900">Ausstattung</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-graphite-900/12 px-3 py-1.5 text-xs text-graphite-700"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-brass/30 bg-white p-5 shadow-card">
            <span className="font-mono text-2xl font-bold text-graphite-900 sm:text-3xl">{formatPrice(vehicle.price)}</span>
            <p className="mt-1 text-xs text-graphite-500">
              {vehicle.vatDeductible ? 'MwSt. ausweisbar' : 'MwSt. nicht ausweisbar'}
            </p>

            {vehicle.dealer && (
              <div className="mt-4 border-t border-graphite-900/8 pt-4 text-sm text-graphite-600">
                <p className="font-semibold text-graphite-900">{vehicle.dealer.companyName}</p>
                <p className="mt-1">
                  {vehicle.dealer.street}, {vehicle.dealer.postalCode} {vehicle.dealer.city}
                </p>
                <p className="mt-1">{vehicle.dealer.phone}</p>
              </div>
            )}

            <a
              href={vehicle.dealer ? `mailto:${vehicle.dealer.email}?subject=${encodeURIComponent(`Anfrage zu ${vehicle.title}`)}` : '#'}
              className="mt-5 flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl bg-brass px-5 text-sm font-semibold text-graphite-950 transition-colors duration-200 hover:bg-brass-light"
            >
              Anfrage senden
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
