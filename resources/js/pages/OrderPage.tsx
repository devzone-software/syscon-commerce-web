import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Payment, Product } from '../types';
import { ProductImage } from '../components/ProductImage';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';

export function OrderPage() {
  const { id = '' } = useParams(); const [params] = useSearchParams(); const { data, error, loading, reload } = useData(() => api.order(id), [id]); const [payment, setPayment] = useState<Payment | null>(null); const [payError, setPayError] = useState(''); const [busy, setBusy] = useState(false);
  const pay = async () => { setBusy(true); setPayError(''); try { setPayment(await api.createPayment(id)); } catch (e) { setPayError((e as Error).message); } finally { setBusy(false); } };
  return <div className="container page"><div className="page-heading"><span className="eyebrow accent">{params.get('pagar') ? 'PASO 3 DE 3' : 'TU COMPRA'}</span><h1>Pedido {id.slice(0, 8).toUpperCase()}</h1></div>{loading ? <Loading /> : error ? <ErrorBox message={error} retry={reload} /> : data && <div className="order-layout"><div className="white-card"><div className="order-top"><h2>Detalle del pedido</h2><span className="status">{data.status}</span></div>{data.details.map((item) => <div className="checkout-line" key={item.productId}><span>{item.name} × {item.quantity}</span><strong>{money(Number(item.unitPrice) * item.quantity)}</strong></div>)}<div className="checkout-line total-line"><span>Total</span><strong>{money(Number(data.total))}</strong></div></div><aside className="summary-card"><h2>Pago</h2>{data.status === 'PAYMENT_PENDING' ? <><p>El método disponible actualmente es pago manual. Un administrador confirmará la referencia tras verificarlo.</p>{payError && <ErrorBox message={payError} />}{payment ? <div className="notice success"><strong>Solicitud de pago creada</strong><br />ID: {payment.id}<br />Estado: {payment.status}<br />Conserva este identificador para consultar el pago.</div> : <button className="button button-primary full" disabled={busy} onClick={pay}>{busy ? 'Procesando…' : 'Solicitar pago manual →'}</button>}</> : <p>Estado actual: <strong>{data.status}</strong>.</p>}<Link className="arrow-link" to="/cuenta/pedidos">Ver todos mis pedidos →</Link></aside></div>}</div>;
}
