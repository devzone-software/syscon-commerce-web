import { useEffect, useMemo } from 'react';
import { reviewCart } from '../lib/cart';
import { api } from '../services/api';
import { useShop } from '../state';
import { useData } from '../ui';

/** Loads the current catalog, refreshes the cart snapshots and reports blocking issues. */
export function useCartReview() {
  const { cart, refreshProducts } = useShop();
  const { data, loading, error, reload } = useData(api.products);
  useEffect(() => {
    if (data) refreshProducts(data);
    // Only when new catalog data arrives; refreshProducts is a new function each render.
  }, [data]);
  const issues = useMemo(() => reviewCart(cart, data), [cart, data]);
  return { issues, checking: loading, error, reload };
}
