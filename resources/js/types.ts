export type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string | null;
  brand: string | null;
  active: boolean;
};
export type Order = {
  id: string;
  status: string;
  total: number;
  customerId?: string;
  details: { productId: string; sku: string; name: string; quantity: number; unitPrice: number }[];
};
export type Payment = {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  amount: number;
  paymentUrl?: string | null;
  externalReference?: string | null;
};
export type User = { id: string; email: string; roles: string[]; permissions?: string[] };
export type CartLine = { product: Product; quantity: number };
