import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AuthDialog from './components/dialogs/AuthDialog';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';
import { StoreProvider, useStore } from './state/StoreContext';
import { supabaseConfigured } from './lib/supabase';

const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function StoreLayout() {
  const { notice, dismissNotice } = useStore();
  return (
    <div className="store">
      <ScrollToTop />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      {notice && <div className="toast" role="status" onClick={dismissNotice}><span>{notice}</span><button aria-label="Dismiss message" onClick={dismissNotice}>×</button></div>}
      <main id="main-content">
        {!supabaseConfigured && <div className="config-banner">Connect the database to load the live catalog and account features. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code>, then restart Vite.</div>}
        <Suspense fallback={<section className="section loading-state" role="status">Loading page…</section>}>
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<CatalogPage collection="all" />} />
            <Route path="cameras" element={<CatalogPage collection="cameras" />} />
            <Route path="accessories" element={<CatalogPage collection="accessories" />} />
            <Route path="products/:productId" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooter />
      <AuthDialog />
    </div>
  );
}

export default function App() {
  return <StoreProvider><StoreLayout /></StoreProvider>;
}
