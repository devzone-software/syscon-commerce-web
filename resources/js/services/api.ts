import type {
  AdminOrder,
  AdminOrderList,
  AdminPage,
  AdminPayment,
  Billing,
  Delivery,
  DeliveryOptions,
  Invoice,
  Order,
  Payment,
  Product,
  Profile,
  Supplier,
  SupplierHistory,
  SignUp,
  SupplierJob,
  User,
} from '../types';

type Envelope<T> = { success: boolean; message?: string; data: T };
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
  let response: Response;
  try {
    response = await fetch(`/web-api${path}`, {
      credentials: 'same-origin',
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrf,
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError('No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.', 0);
  }
  const result = (await response.json().catch(() => null)) as Envelope<T> | null;
  const nextCsrf = response.headers.get('X-CSRF-TOKEN');
  const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  if (nextCsrf && csrfMeta) csrfMeta.content = nextCsrf;
  if (!response.ok || !result?.success) {
    // BFF validation answers `errors`; the platform's 422 envelope carries them in `data`.
    const data = result?.data as unknown;
    const validation =
      (result as (Envelope<T> & { errors?: Record<string, string[]> }) | null)?.errors ??
      (response.status === 422 && data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, string[]>)
        : undefined);
    throw new ApiError(
      validation
        ? Object.values(validation).flat().join(' ')
        : (result?.message ?? 'Ocurrió un error inesperado.'),
      response.status,
    );
  }
  return result.data;
}
const json = (body: unknown) => JSON.stringify(body);
/** Query string without empty filters. */
const query = (filters: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `?${text}` : '';
};
export type OrderFilters = {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
};
export type PaymentFilters = { status?: string; q?: string; page?: number };
export const api = {
  products: () => request<Product[]>('/catalog/products'),
  categories: () => request<string[]>('/catalog/categories'),
  brands: () => request<string[]>('/catalog/brands'),
  product: (id: string) => request<Product>(`/product/${encodeURIComponent(id)}`),
  register: (profile: SignUp) =>
    request<string>('/register', { method: 'POST', body: json(profile) }),
  googleLogin: (credential: string) =>
    request<{ created: boolean }>('/login/google', { method: 'POST', body: json({ credential }) }),
  login: (email: string, password: string) =>
    request<unknown>('/login', { method: 'POST', body: json({ email, password }) }),
  logout: () => request<null>('/logout', { method: 'POST' }),
  me: () => request<User>('/me'),
  orders: () => request<Order[]>('/orders'),
  order: (id: string) => request<Order>(`/orders/${encodeURIComponent(id)}`),
  profile: () => request<Profile>('/profile'),
  deliveryOptions: () => request<DeliveryOptions>('/delivery-options'),
  /** Retrying with the same idempotencyKey returns the order already created. */
  createOrder: (order: {
    items: { productId: string; quantity: number }[];
    billing: Billing;
    delivery: Delivery;
    idempotencyKey: string;
  }) => request<Order>('/orders', { method: 'POST', body: json(order) }),
  createPayment: (orderId: string) =>
    request<Payment>('/payments', { method: 'POST', body: json({ orderId, provider: 'MANUAL' }) }),
  payment: (id: string) => request<Payment>(`/payments/${encodeURIComponent(id)}`),
  saveProduct: (product: Omit<Product, 'id'>) =>
    request<Product>('/admin/products', { method: 'POST', body: json(product) }),
  adminOrders: (filters: OrderFilters) => request<AdminOrderList>(`/admin/orders${query(filters)}`),
  adminOrder: (id: string) => request<AdminOrder>(`/admin/orders/${encodeURIComponent(id)}`),
  adminPayments: (filters: PaymentFilters) =>
    request<AdminPage<AdminPayment>>(`/admin/payments${query(filters)}`),
  setOrderStatus: (id: string, status: string) =>
    request<Order>(`/admin/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: json({ status }),
    }),
  confirmPayment: (id: string, reference: string) =>
    request<Payment>(`/admin/payments/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
      body: json({ reference }),
    }),
  suppliers: () => request<Supplier[]>('/admin/suppliers'),
  createSupplier: (supplier: { name: string; feedUrl: string; minIntervalMinutes: number }) =>
    request<Supplier>('/admin/suppliers', { method: 'POST', body: json(supplier) }),
  runSupplier: (id: string) =>
    request<SupplierJob>(`/admin/suppliers/${encodeURIComponent(id)}/run`, { method: 'POST' }),
  supplierJobs: () => request<SupplierJob[]>('/admin/supplier-jobs'),
  supplierHistory: (jobId: string) =>
    request<SupplierHistory[]>(`/admin/supplier-jobs/${encodeURIComponent(jobId)}/history`),
  createInvoice: (invoice: {
    orderId: string;
    type: string;
    serialNumber: string;
    customerDocumentType: string;
    customerDocumentNumber: string;
    customerName: string;
    referencedSerialNumber: string | null;
  }) => request<Invoice>('/admin/invoices', { method: 'POST', body: json(invoice) }),
  invoice: (id: string) => request<Invoice>(`/admin/invoices/${encodeURIComponent(id)}`),
  submitInvoice: (id: string) =>
    request<Invoice>(`/admin/invoices/${encodeURIComponent(id)}/submit`, { method: 'POST' }),
};
