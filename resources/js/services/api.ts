import type {
  AdminOrder,
  AdminOrderList,
  AdminPage,
  AdminPayment,
  AuditEntry,
  InternalUse,
  IssuedPassword,
  NewAdmin,
  Purchase,
  StaffAccount,
  Billing,
  Delivery,
  DeliveryOptions,
  Invoice,
  InvoiceCustomer,
  InvoiceSeries,
  Order,
  OrderInvoice,
  OrderNotification,
  Payment,
  Product,
  RucInfo,
  StoreSale,
  CashSession,
  CustomerMatch,
  SaleRow,
  SalesSummary,
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
  changePassword: (passwords: {
    currentPassword: string;
    newPassword: string;
    newPassword_confirmation: string;
  }) => request<null>('/password', { method: 'POST', body: json(passwords) }),
  orders: () => request<Order[]>('/orders'),
  order: (id: string) => request<Order>(`/orders/${encodeURIComponent(id)}`),
  /** Documents of the customer's order that SUNAT accepted (drafts are never listed). */
  lookupRuc: (ruc: string) => request<RucInfo>(`/lookup/ruc/${encodeURIComponent(ruc)}`),
  orderInvoices: (id: string) =>
    request<OrderInvoice[]>(`/orders/${encodeURIComponent(id)}/invoices`),
  profile: () => request<Profile>('/profile'),
  deliveryOptions: () => request<DeliveryOptions>('/delivery-options'),
  /** Retrying with the same idempotencyKey returns the order already created. */
  createOrder: (order: {
    items: { productId: string; quantity: number }[];
    billing: Billing;
    delivery: Delivery;
    idempotencyKey: string;
  }) => request<Order>('/orders', { method: 'POST', body: json(order) }),
  /** MANUAL returns the order's existing request; a gateway reuses its pending attempt or opens a new one. */
  createPayment: (orderId: string, provider: 'MANUAL' | 'SANDBOX' | 'MERCADOPAGO' = 'MANUAL') =>
    request<Payment>('/payments', { method: 'POST', body: json({ orderId, provider }) }),
  paymentMethods: () => request<{ manual: boolean; gateways: string[] }>('/payment-methods'),
  payment: (id: string) => request<Payment>(`/payments/${encodeURIComponent(id)}`),
  saveProduct: (product: Omit<Product, 'id'>) =>
    request<Product>('/admin/products', { method: 'POST', body: json(product) }),
  adminOrders: (filters: OrderFilters) => request<AdminOrderList>(`/admin/orders${query(filters)}`),
  adminOrder: (id: string) => request<AdminOrder>(`/admin/orders/${encodeURIComponent(id)}`),
  adminPayments: (filters: PaymentFilters) =>
    request<AdminPage<AdminPayment>>(`/admin/payments${query(filters)}`),
  createSale: (sale: {
    items: { productId: string; quantity: number }[];
    customerId: string | null;
    billing: Billing;
    payment: { method: string; reference: string | null };
    idempotencyKey: string;
  }) => request<StoreSale>('/admin/sales', { method: 'POST', body: json(sale) }),
  cashCurrent: () => request<CashSession | null>('/admin/cash/current'),
  openCash: (openingAmount: string) =>
    request<CashSession>('/admin/cash/open', { method: 'POST', body: json({ openingAmount }) }),
  cashMovement: (movement: { type: 'IN' | 'OUT'; amount: string; reason: string }) =>
    request<CashSession>('/admin/cash/movements', { method: 'POST', body: json(movement) }),
  closeCash: (countedCash: string, notes: string) =>
    request<CashSession>('/admin/cash/close', {
      method: 'POST',
      body: json({ countedCash, notes: notes || null }),
    }),
  cashSessions: (page: number) =>
    request<AdminPage<CashSession>>(`/admin/cash/sessions${query({ page })}`),
  searchCustomers: (q: string) => request<CustomerMatch[]>(`/admin/customers${query({ q })}`),
  salesSummary: (period: { from: string; to: string }) =>
    request<SalesSummary>(`/admin/reports/summary${query(period)}`),
  sales: (filters: { from: string; to: string; page: number; mismatched?: string }) =>
    request<AdminPage<SaleRow>>(`/admin/reports/sales${query(filters)}`),
  /** CSV with every sale of the period, downloaded by the browser. */
  salesCsvUrl: (filters: { from: string; to: string; mismatched?: string }) =>
    `/web-api/admin/reports/sales${query({ ...filters, format: 'csv' })}`,
  resendNotification: (id: string) =>
    request<OrderNotification>(`/admin/notifications/${encodeURIComponent(id)}/resend`, {
      method: 'POST',
    }),
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
  users: (filters: { role?: string; status?: string; q?: string; page?: number }) =>
    request<AdminPage<StaffAccount>>(`/admin/users${query(filters)}`),
  createAdmin: (admin: NewAdmin) =>
    request<IssuedPassword>('/admin/users', { method: 'POST', body: json(admin) }),
  validateUser: (id: string) =>
    request<StaffAccount>(`/admin/users/${encodeURIComponent(id)}/validate`, { method: 'POST' }),
  suspendUser: (id: string) =>
    request<StaffAccount>(`/admin/users/${encodeURIComponent(id)}/suspend`, { method: 'POST' }),
  reactivateUser: (id: string) =>
    request<StaffAccount>(`/admin/users/${encodeURIComponent(id)}/reactivate`, { method: 'POST' }),
  resetUserPassword: (id: string) =>
    request<IssuedPassword>(`/admin/users/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
    }),
  audit: (filters: { userId?: string; role?: string; from?: string; to?: string; page?: number }) =>
    request<AdminPage<AuditEntry>>(`/admin/audit${query(filters)}`),
  purchases: (page: number) => request<AdminPage<Purchase>>(`/admin/purchases${query({ page })}`),
  createPurchase: (purchase: {
    supplierName: string;
    documentRef: string | null;
    notes: string | null;
    items: { productId: string; quantity: number; unitCost: string }[];
  }) => request<Purchase>('/admin/purchases', { method: 'POST', body: json(purchase) }),
  internalUses: (page: number) =>
    request<AdminPage<InternalUse>>(`/admin/internal-uses${query({ page })}`),
  createInternalUse: (use: { productId: string; quantity: number; reason: string }) =>
    request<InternalUse>('/admin/internal-uses', { method: 'POST', body: json(use) }),
  /** The platform assigns series and number; asking again for the order's document returns it. */
  createInvoice: (
    invoice: InvoiceCustomer & {
      orderId: string;
      type: string;
      series: string | null;
      referencedSerialNumber: string | null;
      /** Notes: reason (catalog 09/10), explanation and, depending on it, items or amount. */
      noteCode?: string;
      noteReason?: string;
      amount?: string;
      items?: { productId: string; quantity: number }[];
    },
  ) => request<Invoice>('/admin/invoices', { method: 'POST', body: json(invoice) }),
  invoice: (id: string) => request<Invoice>(`/admin/invoices/${encodeURIComponent(id)}`),
  /** Draft only: fixes the customer before the document is sent. */
  updateInvoice: (id: string, customer: InvoiceCustomer) =>
    request<Invoice>(`/admin/invoices/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: json(customer),
    }),
  invoiceSeries: () => request<InvoiceSeries[]>('/admin/invoice-series'),
  createInvoiceSeries: (series: { type: string; series: string; startAfter: number }) =>
    request<InvoiceSeries>('/admin/invoice-series', { method: 'POST', body: json(series) }),
  setInvoiceSeriesActive: (id: number, active: boolean) =>
    request<InvoiceSeries>(`/admin/invoice-series/${id}`, {
      method: 'PATCH',
      body: json({ active }),
    }),
  voidInvoice: (id: string, reason: string) =>
    request<Invoice>(`/admin/invoices/${encodeURIComponent(id)}/void`, {
      method: 'POST',
      body: json({ reason }),
    }),
  checkInvoiceVoid: (id: string) =>
    request<Invoice>(`/admin/invoices/${encodeURIComponent(id)}/void/check`, { method: 'POST' }),
  reconcileInvoice: (id: string) =>
    request<Invoice>(`/admin/invoices/${encodeURIComponent(id)}/reconcile`, { method: 'POST' }),
  submitInvoice: (id: string) =>
    request<Invoice>(`/admin/invoices/${encodeURIComponent(id)}/submit`, { method: 'POST' }),
};
