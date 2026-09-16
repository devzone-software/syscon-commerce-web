import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { money, useShop } from '../state';
import type { Payment, Product } from '../types';
import { ProductImage } from '../components/ProductImage';
import { useData, ErrorBox, Loading, Empty, ProductCard } from '../ui';

export function About() { return <div className="container page"><div className="page-heading"><span className="eyebrow accent">ACERCA DE SYSCON</span><h1>Tecnología para avanzar</h1><p>SYSCON Commerce reúne productos y herramientas de compra para empresas y profesionales.</p></div><div className="about-box"><strong>Encuentra, compara y compra.</strong><p>Consulta productos disponibles, crea tu pedido y sigue su estado desde tu cuenta.</p><Link className="button button-primary" to="/catalogo">Explorar catálogo →</Link></div></div>; }
