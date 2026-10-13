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
  total: number;
  customerId?: string;
  /** Null for orders created before billing data was captured. */
  billing?: Billing | null;
  /** Null for orders created before the delivery method was captured. */
  delivery?: Delivery | null;
  /** Products only; `total` adds the delivery cost. */
  subtotal?: string;
  createdAt?: string | null;
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
};
