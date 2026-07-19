import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import HomePage from './pages/HomePage';
import VehicleListPage from './pages/VehicleListPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import ServicesPage from './pages/ServicesPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLayout from './admin/components/AdminLayout';
import RequireAdminRole from './admin/components/RequireAdminRole';
import AdminLoginPage from './admin/pages/AdminLoginPage';
import AdminDashboardPage from './admin/pages/AdminDashboardPage';
import AdminVehicleFormPage from './admin/pages/AdminVehicleFormPage';
import AdminUsersPage from './admin/pages/AdminUsersPage';
import AdminChangePasswordPage from './admin/pages/AdminChangePasswordPage';
import { AdminAuthProvider } from './admin/context/AdminAuthContext';

/**
 * Root-Komponente: Layout (Header/Footer) bleibt stabil, waehrend die
 * Kindrouten per AnimatePresence weich ein- und ausblenden (Page-Transitions).
 * MotionConfig respektiert global prefers-reduced-motion.
 * Der Admin-Bereich (/admin/*) laeuft bewusst ausserhalb des oeffentlichen
 * Layouts/PageTransition-Flusses: eigener AdminLayout mit Login-Schutz.
 */
export default function App() {
  const location = useLocation();

  return (
    <MotionConfig reducedMotion="user">
      <AdminAuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="fahrzeuge/neu" element={<AdminVehicleFormPage />} />
            <Route path="fahrzeuge/:id" element={<AdminVehicleFormPage />} />
            <Route path="passwort" element={<AdminChangePasswordPage />} />
            <Route element={<RequireAdminRole allowedRoles={['ADMIN']} />}>
              <Route path="benutzer" element={<AdminUsersPage />} />
            </Route>
          </Route>

          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <AnimatePresence mode="wait" initial={false}>
                  <PageTransition key={location.pathname}>
                    <HomePage />
                  </PageTransition>
                </AnimatePresence>
              }
            />
            <Route
              path="/fahrzeuge"
              element={
                <AnimatePresence mode="wait" initial={false}>
                  <PageTransition key={location.pathname + location.search}>
                    <VehicleListPage />
                  </PageTransition>
                </AnimatePresence>
              }
            />
            <Route
              path="/fahrzeuge/:id"
              element={
                <AnimatePresence mode="wait" initial={false}>
                  <PageTransition key={location.pathname}>
                    <VehicleDetailPage />
                  </PageTransition>
                </AnimatePresence>
              }
            />
            <Route
              path="/leistungen"
              element={
                <AnimatePresence mode="wait" initial={false}>
                  <PageTransition key={location.pathname}>
                    <ServicesPage />
                  </PageTransition>
                </AnimatePresence>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
    </MotionConfig>
  );
}
