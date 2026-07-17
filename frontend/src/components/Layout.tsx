import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useEffect, useState } from 'react';
import { fetchDealers } from '../api/client';
import type { Dealer } from '../types/vehicle';

/** App-Shell: Header, Seiteninhalt (per Outlet), Footer. Einheitlich helles Theme. */
export default function Layout() {
  const [dealer, setDealer] = useState<Dealer | undefined>();

  useEffect(() => {
    fetchDealers()
      .then((dealers: Dealer[]) => setDealer(dealers[0]))
      .catch(() => setDealer(undefined));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-cream text-graphite-900">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer dealer={dealer} />
    </div>
  );
}
