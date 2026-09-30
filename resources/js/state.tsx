import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './services/api';
import { addToCart, cartUnits, setCartQuantity, syncCart } from './lib/cart';
import type { CartLine, Product, User } from './types';

type State = {
  user: User | null;
  loadingUser: boolean;
  reloadUser: () => Promise<void>;
  logout: () => Promise<void>;
  cart: CartLine[];
  add: (product: Product, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  refreshProducts: (products: Product[]) => void;
  count: number;
};
const Context = createContext<State | null>(null);
const key = 'syscon.cart.v1';
function readCart(): CartLine[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value)
      ? value.filter(
          (line) => line?.product?.id && Number.isInteger(line.quantity) && line.quantity > 0,
        )
      : [];
  } catch {
    return [];
  }
}
export function StateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const reloadUser = async () => {
    try {
      setUser(await api.me());
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };
  useEffect(() => {
    void reloadUser();
  }, []);
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart]);
  const add = (product: Product, quantity = 1) =>
    setCart((current) => addToCart(current, product, quantity));
  const setQuantity = (id: string, quantity: number) =>
    setCart((current) => setCartQuantity(current, id, quantity));
  const clear = () => setCart([]);
  const refreshProducts = (products: Product[]) =>
    setCart((current) => syncCart(current, products));
  const logout = async () => {
    await api.logout();
    setUser(null);
  };
  const value = useMemo(
    () => ({
      user,
      loadingUser,
      reloadUser,
      logout,
      cart,
      add,
      setQuantity,
      clear,
      refreshProducts,
      count: cartUnits(cart),
    }),
    [user, loadingUser, cart],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useShop() {
  const value = useContext(Context);
  if (!value) throw new Error('StateProvider missing');
  return value;
}
export const money = (amount: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
