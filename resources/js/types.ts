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
/** Billing data chosen at checkout; the order keeps it as a copy (SUNAT catalogs 01 and 06). */
export type Billing = {
  type: '01' | '03';
  documentType: '1' | '4' | '6' | '7';
  documentNumber: string;
  name: string;
  address?: string | null;
};
export type DeliveryMethod = 'PICKUP' | 'DELIVERY';
/** Delivery chosen at checkout; the cost is always set by the platform. */
export type Delivery = {
  method: DeliveryMethod;
  cost?: string;
  contactName: string;
  contactPhone: string;
  address?: string | null;
  district?: string | null;
  reference?: string | null;
};
/** GET /orders/delivery-options: what the checkout can offer and what each option costs. */
export type DeliveryOptions = {
  pickup: { enabled: boolean; cost: string; address: string | null; hours: string | null };
  delivery: { enabled: boolean; cost: string | null; areas: string | null };
};
export type Order = {
  id: string;
  status: string;
  /** Decimal string from the platform, e.g. "159.70". */
  total: string;
  customerId?: string;
  /** Null for orders created before billing data was captured. */
  billing?: Billing | null;
  /** Null for orders created before the delivery method was captured. */
  delivery?: Delivery | null;
  /** Products only; `total` adds the delivery cost. */
  subtotal?: string;
  /** Prices include IGV: base and tax split from `total` (null rate on very old payloads). */
  taxes?: TaxSummary;
  createdAt?: string | null;
  /** While unpaid: when the stock reservation ends and the order expires (null = never). */
  expiresAt?: string | null;
  details: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: string;
    lineTotal?: string;
    taxableAmount?: string;
    taxAmount?: string;
  }[];
};
export type TaxSummary = { rate: string; taxableAmount: string; taxAmount: string };
export type Payment = {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  amount: string;
  paymentUrl?: string | null;
  externalReference?: string | null;
  /** Configured manual payment instructions, only while the payment is pending. */
  instructions?: string | null;
  createdAt?: string | null;
  confirmedAt?: string | null;
  /** Backoffice only: e-mail of whoever confirmed it. */
  confirmedBy?: string | null;
};
/** Row of the backoffice payments inbox (GET /admin/payments). */
export type AdminPayment = Payment & {
  customerEmail: string;
  orderStatus: string;
  orderExpiresAt: string | null;
};
export type AdminPage<T> = { items: T[]; page: number; perPage: number; total: number };
/** GET /admin/reports/summary: period figures (Lima days) plus current snapshots. */
export type SalesSummary = {
  period: { from: string; to: string; timezone: string };
  sales: {
    orders: number;
    total: string;
    taxableAmount: string;
    taxAmount: string;
    deliveryTotal: string;
    averageTicket: string;
    byDay: { date: string; orders: number; total: string }[];
  };
  releasedOrders: Record<'CANCELLED' | 'EXPIRED', { orders: number; total: string }>;
  pendingPayments: {
    orders: number;
    total: string;
    oldestCreatedAt: string | null;
    expiringIn24h: number;
  };
  reservations: { units: number; products: number; value: string };
  invoices: { type: string; byStatus: Record<string, number>; acceptedTotal: string }[];
  reconciliation: {
    paidOrdersTotal: string;
    approvedPaymentsTotal: string;
    netInvoicedTotal: string;
    ordersWithoutInvoice: number;
    mismatchedOrders: number;
  };
};
/** GET /admin/reports/sales: one sold order with its payment and documents. */
export type SaleRow = {
  orderId: string;
  paidAt: string;
  status: string;
  customerEmail: string;
  billingName: string | null;
  billingDocument: string | null;
  total: string;
  taxableAmount: string;
  taxAmount: string;
  deliveryCost: string;
  paidAmount: string;
  paymentReferences: string[];
  invoices: { id: string; type: string; serialNumber: string; status: string; total: string }[];
  netInvoiced: string;
  issues: string[];
  reconciled: boolean;
};
/** Row of the backoffice orders inbox (GET /admin/orders). */
export type AdminOrderSummary = {
  id: string;
  status: string;
  total: string;
  createdAt: string | null;
  expiresAt: string | null;
  customer: { id: string; email: string; name: string | null };
  billing: { type: '01' | '03'; documentNumber: string; name: string } | null;
  deliveryMethod: DeliveryMethod | null;
  payment: { id: string; status: string } | null;
  invoice: { id: string; serialNumber: string; status: string } | null;
};
export type AdminOrderList = AdminPage<AdminOrderSummary> & { counts: Record<string, number> };
export type OrderEvent = {
  type: string;
  from: string | null;
  to: string | null;
  reference: string | null;
  /** E-mail of the user who acted; null with `system` when the platform did it. */
  actor: string | null;
  system: boolean;
  at: string | null;
};
/** GET /admin/orders/{id}: the order with everything related to it. */
export type AdminOrder = Order & {
  customer: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    documentType: string | null;
    documentNumber: string | null;
  } | null;
  payments: Payment[];
  invoices: {
    id: string;
    type: string;
    serialNumber: string;
    status: string;
    total: string;
    createdAt: string | null;
  }[];
  events: OrderEvent[];
  /** Customer emails of the order (outbox), oldest first. */
  notifications?: OrderNotification[];
};
export type OrderNotification = {
  id: string;
  /** ORDER_CREATED, PAYMENT_CONFIRMED or INVOICE_AVAILABLE. */
  type: string;
  reference: string | null;
  recipient: string;
  /** PENDING, SENDING, SENT or FAILED. */
  status: string;
  attempts: number;
  lastError: string | null;
  /** Next automatic retry; null after the last one (manual resend only). */
  nextAttemptAt: string | null;
  sentAt: string | null;
  createdAt: string | null;
};
export type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles: string[];
  permissions?: string[];
};
export type DocumentType = 'DNI' | 'CE' | 'RUC' | 'PASAPORTE';
export type Profile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  documentType: DocumentType | null;
  documentNumber: string | null;
  phone: string | null;
};
export type SignUp = {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
};
export type CartLine = { product: Product; quantity: number };

/** Entities returned as-is by supplier-service. */
export type Supplier = {
  id: string;
  name: string;
  feedUrl: string;
  active: boolean;
  minIntervalMinutes: number;
};
export type SupplierJob = {
  id: string;
  supplier: Supplier;
  startedAt: string | null;
  finishedAt: string | null;
  status: string;
  imported: number;
};
export type SupplierHistory = {
  id: string;
  occurredAt: string;
  level: string;
  message: string | null;
};

/** InvoiceService.View from invoice-service. */
export type Invoice = {
  id: string;
  orderId: string;
  type: string;
  serialNumber: string;
  status: string;
  error: string | null;
  sunatCode: string | null;
  sunatDescription: string | null;
  customerDocumentType?: string;
  customerDocumentNumber?: string;
  customerName?: string;
  referencedSerialNumber?: string | null;
  /** Reason of a credit (catalog 09) or debit (catalog 10) note. */
  noteCode?: string | null;
  noteReason?: string | null;
  taxRate?: string;
  taxableAmount?: string;
  taxAmount?: string;
  total?: string;
  createdAt?: string | null;
  lines?: InvoiceLine[];
  /** The endpoint is SUNAT's test service: accepted documents are tests. */
  test?: boolean;
  hasCdr?: boolean;
};
/** GET /orders/{id}/invoices: what the customer can download. */
export type OrderInvoice = {
  id: string;
  type: string;
  serialNumber: string;
  status: string;
  referencedSerialNumber: string | null;
  total: string;
  createdAt: string | null;
  /** Accepted by SUNAT's test service: printed as a test document without tax value. */
  test: boolean;
  hasCdr: boolean;
};
/** Line stored with the document; XML and printed copy read these amounts. */
export type InvoiceLine = {
  lineNumber: number;
  productId: string | null;
  sku: string | null;
  description: string;
  /** NIU goods, ZZ services (delivery, interest, adjustments). */
  unitCode: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  taxableAmount: string;
  taxAmount: string;
};
/** Series configured on the platform; `nextNumber` is the serial the next document gets. */
export type InvoiceSeries = {
  id: number;
  type: string;
  series: string;
  lastNumber: number;
  nextNumber: string;
  active: boolean;
};
export type InvoiceCustomer = {
  customerDocumentType: string;
  customerDocumentNumber: string;
  customerName: string;
};
