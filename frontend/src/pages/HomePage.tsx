import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import ErrorState from '../components/ErrorState';
import ScrollReveal from '../components/ScrollReveal';
import { useVehicles } from '../hooks/useVehicles';
import { HandshakeIcon, WrenchIcon, ShieldCheckIcon } from '../components/serviceIcons';

/** Startseite: Fullscreen-Hero + kuratierte Auswahl + Marken-Werte-Sektion. */
export default function HomePage() {
  const { vehicles, isLoading, error, refetch } = useVehicles({ pageSize: 6 });
  const featuredVehicle = [...vehicles].sort((a, b) => b.price - a.price)[0];

  return (
    <>
      <Hero featuredVehicle={featuredVehicle} />

      <ScrollReveal className="section-container py-8" itemSelector=".reveal-item">
        <div className="reveal-item mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-dim">Aktuelle Auswahl</p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-graphite-900 sm:text-3xl">
              Fahrzeuge mit Charakter
            </h2>
          </div>
          <Link
            to="/fahrzeuge"
            className="flex min-h-[44px] cursor-pointer items-center rounded-full border border-brass px-5 text-sm font-semibold text-brass-dim transition-colors duration-200 hover:bg-brass hover:text-graphite-950"
          >
            Alle Fahrzeuge ansehen
          </Link>
        </div>

        {error && <ErrorState message={error} onRetry={refetch} />}

        {!error && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="reveal-item">
                    <VehicleCardSkeleton />
                  </div>
                ))
              : vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="reveal-item">
                    <VehicleCard vehicle={vehicle} />
                  </div>
                ))}
          </div>
        )}
      </ScrollReveal>

      <ScrollReveal className="section-container pb-12" itemSelector=".reveal-item">
        <div className="reveal-item mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-dim">Über uns</p>
          <h2 className="mt-1.5 font-display text-xl font-semibold text-graphite-900 sm:text-2xl">
            Weil der Fahrzeugkauf Vertrauenssache ist
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-graphite-600">
            Durch jahrelange Erfahrung im Automobilvertrieb hat unser Team ein breitgefächertes Netzwerk rund ums
            Automobil aufgebaut. Wir haben uns zum Ziel gesetzt, Lösungen für sämtliche Probleme rund ums Automobil zu
            finden — unser Service fängt erst nach dem Verkauf eines Fahrzeuges an.
          </p>
        </div>

        <div className="reveal-item grid grid-cols-1 gap-6 rounded-3xl border border-graphite-900/8 bg-white p-6 sm:grid-cols-3 sm:p-8">
          {[
            { icon: ShieldCheckIcon, title: 'Geprüfte Qualität', text: 'Jedes Fahrzeug wird mangelfrei ausgeliefert und vor Verkauf sorgfältig geprüft.' },
            { icon: HandshakeIcon, title: 'Transparente Preise', text: 'Alle Angaben inkl. MwSt.-Status, keine versteckten Kosten.' },
            { icon: WrenchIcon, title: 'Werkstattservice inklusive', text: 'Aftersalesservice mit hauseigener Werkstatt für die Wartung Ihres Fahrzeugs.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="reveal-item">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brass/12 text-brass-dim">
                  <Icon width={20} height={20} />
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-graphite-900">{item.title}</h3>
                <p className="mt-2 text-sm text-graphite-600">{item.text}</p>
              </div>
            );
          })}
        </div>

        <div className="reveal-item mt-5 text-center">
          <Link
            to="/leistungen"
            className="inline-flex min-h-[44px] cursor-pointer items-center text-sm font-semibold text-brass-dim underline-offset-4 hover:underline"
          >
            Alle 16 Serviceleistungen ansehen →
          </Link>
        </div>
      </ScrollReveal>
    </>
  );
}
