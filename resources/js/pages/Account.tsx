import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Payment, Product } from '../types';
import { ProductImage } from '../components/ProductImage';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';

export function Account() {
  const { user } = useShop();
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow accent">MI CUENTA</span>
        <h1>Hola, {user?.email}</h1>
        <p>Administra tus compras desde aquí.</p>
      </div>
      <div className="account-grid">
        {user?.roles.includes('ROLE_ADMIN') && (
          <Link className="account-tile" to="/admin">
            <span>◆</span>
            <h2>Administración</h2>
            <p>Gestiona productos, pedidos y pagos manuales.</p>
            <b>Ir al panel →</b>
          </Link>
        )}
        <Link className="account-tile" to="/cuenta/pedidos">
          <span>▣</span>
          <h2>Mis pedidos</h2>
          <p>Consulta estados y detalles de tus compras.</p>
          <b>Ver pedidos →</b>
        </Link>
        <div className="account-tile">
          <span>◇</span>
          <h2>Comprobantes</h2>
          <p>
            La consulta de comprobantes para clientes estará disponible cuando el servicio de
            facturación exponga este endpoint.
          </p>
        </div>
        <div className="account-tile">
          <span>◉</span>
          <h2>Mi perfil</h2>
          <p>
            Correo: <strong>{user?.email}</strong>
          </p>
          <p>ID de cuenta: {user?.id}</p>
        </div>
      </div>
    </div>
  );
}
