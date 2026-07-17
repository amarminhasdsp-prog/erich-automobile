import type { AdminRole } from '../api/adminClient';

const ROLE_STYLES: Record<AdminRole, string> = {
  ADMIN: 'bg-amber-bg text-amber border-amber/30',
  EDITOR: 'bg-steel-bg text-steel border-steel/30',
}; // Farbe ist nie der einzige Indikator: Label transportiert die Rolle zusaetzlich.

const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: 'Administrator',
  EDITOR: 'Redakteur',
};

/** Rollen-Badge fuer die Benutzer-Tabelle, im gleichen visuellen Vokabular wie StatusBadge. */
export default function RoleBadge({ role, className = '' }: { role: AdminRole; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${ROLE_STYLES[role]} ${className}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
