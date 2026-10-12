import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StateProvider } from './state';
import { Layout, Loading, RequireAuth } from './ui';
import '../css/app.css';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Catalog = lazy(() =>
  import('./pages/Catalog').then((module) => ({ default: module.Catalog })),
);
const ProductPage = lazy(() =>
  import('./pages/ProductPage').then((module) => ({ default: module.ProductPage })),
);
const Cart = lazy(() => import('./pages/Cart').then((module) => ({ default: module.Cart })));
const Auth = lazy(() => import('./pages/Auth').then((module) => ({ default: module.Auth })));
const Checkout = lazy(() =>
  import('./pages/Checkout').then((module) => ({ default: module.Checkout })),
);
const OrderPage = lazy(() =>
  import('./pages/OrderPage').then((module) => ({ default: module.OrderPage })),
);
const Orders = lazy(() => import('./pages/Orders').then((module) => ({ default: module.Orders })));
const Account = lazy(() =>
  import('./pages/Account').then((module) => ({ default: module.Account })),
);
const Backoffice = lazy(() =>
  import('./pages/backoffice/Backoffice').then((module) => ({ default: module.Backoffice })),
);
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Recover = lazy(() =>
  import('./pages/Recover').then((module) => ({ default: module.Recover })),
);
const Categories = lazy(() =>
  import('./pages/Categories').then((module) => ({ default: module.Categories })),
);
const Offers = lazy(() => import('./pages/Offers').then((module) => ({ default: module.Offers })));
const Contact = lazy(() =>
  import('./pages/Contact').then((module) => ({ default: module.Contact })),
);
const NotFound = lazy(() =>
  import('./pages/NotFound').then((module) => ({ default: module.NotFound })),
);

function StoreRoutes() {
  return (
    <Layout>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductPage />} />
          <Route path="/carrito" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="/pedido/:id"
            element={
              <RequireAuth>
                <OrderPage />
              </RequireAuth>
            }
          />
          <Route
            path="/cuenta"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="/cuenta/pedidos"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route path="/nosotros" element={<About />} />
          <Route path="/categorias" element={<Categories />} />
          <Route path="/ofertas" element={<Offers />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <StateProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* The backoffice has its own layout, separate from the public store. */}
            <Route
              path="/admin/*"
              element={
                <RequireAuth>
                  <Backoffice />
                </RequireAuth>
              }
            />
            {/* Sign in, sign up and recovery use their own slim header and footer. */}
            <Route path="/ingresar" element={<Auth />} />
            <Route path="/registro" element={<Auth register />} />
            <Route path="/recuperar" element={<Recover />} />
            <Route path="*" element={<StoreRoutes />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </StateProvider>
  );
}
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
