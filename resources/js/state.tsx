import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './services/api';
import type { CartLine, Product, User } from './types';

type State = { user: User | null; loadingUser: boolean; reloadUser: () => Promise<void>; logout: () => Promise<void>; cart: CartLine[]; add: (product: Product) => void; setQuantity: (id: string, quantity: number) => void; clear: () => void; count: number };
const Context = createContext<State | null>(null);
const key = 'syscon.cart.v1';
function readCart(): CartLine[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((line) => line?.product?.id && Number.isInteger(line.quantity) && line.quantity > 0) : [];
  } catch { return []; }
}
export function StateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const reloadUser = async () => { try { setUser(await api.me()); } catch { setUser(null); } finally { setLoadingUser(false); } };
  useEffect(() => { void reloadUser(); }, []);
  useEffect(() => { localStorage.setItem(key, JSON.stringify(cart)); }, [cart]);
  const add = (product: Product) => setCart((current) => {
    if (product.stock < 1) return current;
    const found = current.find((line) => line.product.id === product.id);
    if (found) return current.map((line) => line.product.id === product.id ? { ...line, product, quantity: Math.min(product.stock, line.quantity + 1) } : line);
    return [...current, { product, quantity: 1 }];
  });
  const setQuantity = (id: string, quantity: number) => setCart((current) => current.flatMap((line) => line.product.id !== id ? [line] : quantity <= 0 || line.product.stock < 1 ? [] : [{ ...line, quantity: Math.min(line.product.stock, Math.max(1, Math.floor(quantity))) }]));
  const clear = () => setCart([]);
  const logout = async () => { await api.logout(); setUser(null); };
  const value = useMemo(() => ({ user, loadingUser, reloadUser, logout, cart, add, setQuantity, clear, count: cart.reduce((n, line) => n + line.quantity, 0) }), [user, loadingUser, cart]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useShop() { const value = useContext(Context); if (!value) throw new Error('StateProvider missing'); return value; }
export const money = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
