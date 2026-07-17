import { motion } from 'framer-motion';
import type { VehicleStatus } from '../types/vehicle';
import { statusLabels } from '../utils/labels';

interface Props {
  status: VehicleStatus;
  className?: string;
}

const STATUS_STYLES: Record<VehicleStatus, string> = {
  VERFUEGBAR: 'bg-racing-bg text-racing border-racing/30',
  RESERVIERT: 'bg-amber-bg text-amber border-amber/30',
  VERKAUFT: 'bg-steel-bg text-steel border-steel/30',
  ENTWURF: 'bg-steel-bg text-steel border-steel/30',
}; // Farbe ist nie der einzige Indikator: Label + Punkt-Icon transportieren den Status zusaetzlich.

const DOT_STYLES: Record<VehicleStatus, string> = {
  VERFUEGBAR: 'bg-racing',
  RESERVIERT: 'bg-amber',
  VERKAUFT: 'bg-steel',
  ENTWURF: 'bg-steel',
};

const BADGE_TRANSITION = { type: 'spring' as const, stiffness: 400, damping: 30 };

// layout-Animation: wechselt der Status (z.B. Verfuegbar -> Reserviert), gleitet
// das Badge weich in die neue Farbe/Groesse statt hart zu springen.
export default function StatusBadge({ status, className = '' }: Props) {
  return (
    <motion.span
      layout
      transition={BADGE_TRANSITION}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${STATUS_STYLES[status]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[status]}`} aria-hidden="true" />
      {statusLabels[status]}
    </motion.span>
  );
}
