import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Payment, Product } from '../types';
import { ProductImage } from '../components/ProductImage';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';

export function Orders() { const { data, error, loading, reload } = useData(api.orders); return <div className="container page"><div className="page-heading"><span className="eyebrow accent">MI CUENTA</span><h1>Mis pedidos</h1></div>{loading ? <Loading /> : error ? <ErrorBox message={error} retry={reload} /> : data?.length ? <div className="order-list">{data.map((o) => <Link to={`/pedido/${o.id}`} className="order-row" key={o.id}><div><strong>Pedido {o.id.slice(0, 8).toUpperCase()}</strong><span>{o.details.length} producto(s)</span></div><span className="status">{o.status}</span><strong>{money(Number(o.total))}</strong><span>→</span></Link>)}</div> : <Empty title="Aún no tienes pedidos" text="Cuando completes una compra aparecerá aquí." action={<Link className="button button-primary" to="/catalogo">Explorar productos</Link>} />}</div>; }
