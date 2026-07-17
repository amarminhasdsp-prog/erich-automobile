import ScrollReveal from '../components/ScrollReveal';
import {
  HandshakeIcon,
  TagIcon,
  ShieldCheckIcon,
  BadgeCheckIcon,
  CoinsIcon,
  FileTextIcon,
  TruckIcon,
  WrenchIcon,
  StethoscopeIcon,
  ZapIcon,
  CodeIcon,
  SettingsIcon,
  CertificateIcon,
  SparklesIcon,
  PaintBucketIcon,
} from '../components/serviceIcons';

interface Service {
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  title: string;
  text: string;
}

const SERVICES: Service[] = [
  { icon: HandshakeIcon, title: 'Fahrzeugankauf', text: 'Wir kaufen Ihr Fahrzeug fair und unkompliziert – mit transparenter Bewertung.' },
  { icon: TagIcon, title: 'Fahrzeugverkauf', text: 'Kuratierte Auswahl geprüfter Fahrzeuge mit vollständiger Dokumentation.' },
  { icon: ShieldCheckIcon, title: 'Gewährleistung', text: 'Gesetzliche Gewährleistung auf jeden Fahrzeugkauf.' },
  { icon: BadgeCheckIcon, title: 'Garantieservice', text: 'Erweiterte Garantieoptionen für zusätzliche Sicherheit nach dem Kauf.' },
  { icon: CoinsIcon, title: 'Finanzierung', text: 'Individuelle Finanzierungslösungen passend zu Ihrem Budget.' },
  { icon: FileTextIcon, title: 'Zulassungsservice', text: 'Wir übernehmen die komplette Zulassung Ihres neuen Fahrzeugs.' },
  { icon: TruckIcon, title: 'KFZ-Überführungen', text: 'Sichere und zuverlässige Überführung Ihres Fahrzeugs an den Wunschort.' },
  { icon: WrenchIcon, title: 'Werkstattservice', text: 'Hauseigene Werkstatt für Wartung, Reparatur und Inspektion.' },
  { icon: StethoscopeIcon, title: 'Fahrzeugdiagnosen', text: 'Moderne Diagnosetechnik zur präzisen Fehlererkennung.' },
  { icon: ZapIcon, title: 'Fahrzeugelektrik', text: 'Fachgerechte Instandsetzung und Prüfung der Fahrzeugelektrik.' },
  { icon: CodeIcon, title: 'Codierung', text: 'Individuelle Codierung und Freischaltung von Fahrzeugfunktionen.' },
  { icon: SettingsIcon, title: 'Nach- & Umrüstungen', text: 'Professionelle Nach- und Umrüstmaßnahmen am Fahrzeug.' },
  { icon: CertificateIcon, title: 'TÜV-Service', text: 'Organisation und Begleitung der Hauptuntersuchung.' },
  { icon: SparklesIcon, title: 'Fahrzeugaufbereitung', text: 'Innen- und Außenaufbereitung für den Neuwagen-Glanz.' },
  { icon: PaintBucketIcon, title: 'Lackierservice', text: 'Lackreparatur und -aufbereitung in gewohnter Qualität.' },
];

/**
 * Leistungen-Seite: Alle Serviceleistungen von Erich Automobile Stuttgart
 * als Karten-Grid, plus Ueber-uns- und Sales/Aftersales-Text aus den
 * Geschaeftsdaten.
 */
export default function ServicesPage() {
  return (
    <div className="section-container py-8">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-dim">Unsere Leistungen</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold text-graphite-900 sm:text-4xl">
          Alles rund ums Automobil – aus einer Hand
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-graphite-600">
          Durch jahrelange Erfahrung im Automobilvertrieb hat unser Team ein breitgefächertes Netzwerk rund ums
          Automobil aufgebaut. Wir haben uns zum Ziel gesetzt, Lösungen für sämtliche Probleme rund ums Automobil zu
          finden. Unsere Stärke ist es, für jede Problematik am Automobil eine Lösung zu finden.
        </p>
      </div>

      <ScrollReveal className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" itemSelector=".reveal-item">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.title}
              className="reveal-item rounded-2xl border border-graphite-900/8 bg-white p-4 shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brass/12 text-brass-dim">
                <Icon width={22} height={22} />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-graphite-900">{service.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite-600">{service.text}</p>
            </div>
          );
        })}
      </ScrollReveal>

      <ScrollReveal className="mt-10" itemSelector=".reveal-item">
        <div className="reveal-item rounded-3xl border border-brass/25 bg-brass/8 p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-dim">Sales &amp; Aftersales</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-graphite-900 sm:text-2xl">
            Unser Service fängt erst nach dem Verkauf eines Fahrzeuges an.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite-600">
            Jedes Auto wird mangelfrei ausgeliefert. Unser Aftersalesservice beinhaltet die Wartung des erworbenen
            Fahrzeugs — damit Sie sich auch lange nach dem Kauf auf uns verlassen können.
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
