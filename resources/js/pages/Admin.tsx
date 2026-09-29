import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { useShop } from '../state';
import type { Product } from '../types';
import { ErrorBox, useData } from '../ui';

type ProductForm = Omit<Product, 'id'>;
const blank: ProductForm = {
  sku: '',
  name: '',
  price: 0,
  stock: 0,
  imageUrl: null,
  category: null,
  brand: null,
  active: true,
};

export function Admin() {
  const { user } = useShop();
  const { data: products, error, loading, reload } = useData(api.products);
  const [form, setForm] = useState<ProductForm>(blank);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('PROCESSING');
  const [paymentId, setPaymentId] = useState('');
  const [reference, setReference] = useState('');

  if (!user?.roles.includes('ROLE_ADMIN')) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent, action: () => Promise<unknown>, success: string) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = (event: FormEvent) =>
    submit(
      event,
      async () => {
        await api.saveProduct(form);
        reload();
      },
      'Producto guardado.',
    );
  const updateOrder = (event: FormEvent) =>
    submit(event, () => api.setOrderStatus(orderId, status), 'Estado actualizado.');
  const confirmPayment = (event: FormEvent) =>
    submit(event, () => api.confirmPayment(paymentId, reference), 'Pago confirmado.');

  return (
    <div className="container page admin-page">
      <div className="page-heading">
        <span className="eyebrow accent">GESTIÓN SYSCON</span>
        <h1>Panel administrativo</h1>
        <p>Gestiona el catálogo y las operaciones habilitadas por los servicios.</p>
      </div>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <div className="admin-stat">
        <span>Productos publicados</span>
        <strong>{loading ? '…' : error ? '—' : (products?.length ?? 0)}</strong>
      </div>
      {error && <ErrorBox message={error} retry={reload} />}
      <div className="admin-grid">
        <section className="white-card">
          <h2>Crear o actualizar producto</h2>
          <p className="muted">Si el SKU existe, el servicio Java actualizará el producto.</p>
          <form className="admin-form" onSubmit={saveProduct}>
            <label>
              SKU
              <input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </label>
            <label>
              Nombre
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Precio (PEN)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </label>
            <label>
              Stock
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />
            </label>
            <label>
              URL de imagen
              <input
                type="url"
                value={form.imageUrl ?? ''}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value || null })}
              />
            </label>
            <label>
              Categoría
              <input
                value={form.category ?? ''}
                onChange={(e) => setForm({ ...form, category: e.target.value || null })}
              />
            </label>
            <label>
              Marca
              <input
                value={form.brand ?? ''}
                onChange={(e) => setForm({ ...form, brand: e.target.value || null })}
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />{' '}
              Activo
            </label>
            <button className="button button-primary" disabled={busy}>
              Guardar producto
            </button>
          </form>
        </section>
        <div className="admin-side">
          <section className="white-card">
            <h2>Actualizar pedido</h2>
            <form className="admin-form" onSubmit={updateOrder}>
              <label>
                ID del pedido
                <input required value={orderId} onChange={(e) => setOrderId(e.target.value)} />
              </label>
              <label>
                Nuevo estado
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>PROCESSING</option>
                  <option>SHIPPED</option>
                  <option>DELIVERED</option>
                  <option>CANCELLED</option>
                </select>
              </label>
              <button className="button button-secondary" disabled={busy}>
                Actualizar estado
              </button>
            </form>
          </section>
          <section className="white-card">
            <h2>Confirmar pago manual</h2>
            <form className="admin-form" onSubmit={confirmPayment}>
              <label>
                ID del pago
                <input required value={paymentId} onChange={(e) => setPaymentId(e.target.value)} />
              </label>
              <label>
                Referencia verificada
                <input required value={reference} onChange={(e) => setReference(e.target.value)} />
              </label>
              <button className="button button-secondary" disabled={busy}>
                Confirmar pago
              </button>
            </form>
          </section>
          <section className="white-card">
            <h2>Clientes y reportes</h2>
            <p className="muted">
              El backend aún no expone listados globales de clientes, pedidos ni reportes. Estas
              vistas se habilitarán cuando existan endpoints autorizados.
            </p>
          </section>
        </div>
      </div>
      <section className="white-card admin-products">
        <h2>Productos del catálogo</h2>
        {products?.length ? (
          <div className="admin-product-list">
            {products.map((product) => (
              <div className="admin-product-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>
                    SKU {product.sku} · {product.stock} unidades
                  </span>
                </div>
                <button
                  className="link-button"
                  onClick={() => {
                    setForm({
                      sku: product.sku,
                      name: product.name,
                      price: Number(product.price),
                      stock: product.stock,
                      imageUrl: product.imageUrl,
                      category: product.category,
                      brand: product.brand,
                      active: product.active,
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No hay productos publicados.</p>
        )}
      </section>
    </div>
  );
}
