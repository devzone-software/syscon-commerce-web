import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Payment, Product } from '../types';
import { ProductImage } from '../components/ProductImage';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';

export function NotFound() {
  return (
    <div className="container page">
      <Empty
        title="Página no encontrada"
        text="La dirección que buscas no existe."
        action={
          <Link className="button button-primary" to="/">
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
