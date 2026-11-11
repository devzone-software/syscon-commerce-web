import type { ReactElement } from 'react';
import { permissions, type Permission } from '../../lib/auth';
import { ActivityAdmin } from './ActivityAdmin';
import { BillingAdmin } from './BillingAdmin';
import { CashRegister } from './CashRegister';
import { ComplaintsAdmin } from './ComplaintsAdmin';
import { Dashboard } from './Dashboard';
import { DirectSale } from './DirectSale';
import { InternalUseAdmin } from './InternalUseAdmin';
import { InventoryAdmin } from './InventoryAdmin';
import { OrdersAdmin } from './OrdersAdmin';
import { PaymentsAdmin } from './PaymentsAdmin';
import { ProductBulkAdmin } from './ProductBulkAdmin';
import { ProductsAdmin } from './ProductsAdmin';
import { PurchasesAdmin } from './PurchasesAdmin';
import { ReportsAdmin } from './ReportsAdmin';
import { SalesReport } from './SalesReport';
import { SuppliersAdmin } from './SuppliersAdmin';
import { TaxonomyAdmin } from './TaxonomyAdmin';
import { UsersAdmin } from './UsersAdmin';

type Section = {
  path: string;
  label: string;
  group: string;
  description: string;
  permission?: Permission;
  element: ReactElement;
  /** Secondary tools stay routable under their parent menu entry. */
  parent?: string;
};

/** Only sections backed by existing APIs are listed; see docs/API-NECESARIAS.md. */
export const sections: Section[] = [
  {
    path: '',
    label: 'Panel',
    group: 'General',
    description: 'Resumen de las áreas habilitadas para tu cuenta.',
    element: <Dashboard />,
  },
  {
    path: 'productos',
    description: 'Mantener productos, precios, publicación y clasificación del catálogo.',
    label: 'Productos',
    group: 'Catálogo',
    permission: permissions.catalogWrite,
    element: <ProductsAdmin />,
  },
  {
    path: 'carga-masiva',
    description: 'Importar y exportar información de productos.',
    label: 'Importar / exportar',
    parent: 'productos',
    group: 'Catálogo',
    permission: permissions.catalogWrite,
    element: <ProductBulkAdmin />,
  },
  {
    path: 'categorias',
    description: 'Organizar las categorías y marcas de los productos.',
    parent: 'productos',
    label: 'Categorías y marcas',
    group: 'Catálogo',
    permission: permissions.catalogWrite,
    element: <TaxonomyAdmin />,
  },
  {
    path: 'proveedores',
    description: 'Gestionar proveedores y consultar sus actualizaciones.',
    label: 'Proveedores',
    group: 'Catálogo',
    permission: permissions.suppliersManage,
    element: <SuppliersAdmin />,
  },
  {
    path: 'existencias',
    description: 'Consultar stock físico, reservado y disponible de los productos.',
    label: 'Existencias',
    group: 'Inventario',
    permission: permissions.catalogWrite,
    element: <InventoryAdmin />,
  },
  {
    path: 'compras',
    description: 'Registrar compras a proveedores y consultar sus productos e importes.',
    label: 'Compras a proveedores',
    group: 'Inventario',
    permission: permissions.inventoryManage,
    element: <PurchasesAdmin />,
  },
  {
    path: 'uso-interno',
    description: 'Registrar salidas de productos destinados al uso de la empresa.',
    label: 'Retiros para uso interno',
    group: 'Inventario',
    permission: permissions.inventoryManage,
    element: <InternalUseAdmin />,
  },
  {
    path: 'pedidos',
    description:
      'Atender pedidos, consultar pagos y comprobantes y avanzar la preparación y entrega.',
    label: 'Pedidos',
    group: 'Ventas',
    permission: permissions.ordersManage,
    element: <OrdersAdmin />,
  },
  {
    path: 'venta-directa',
    description: 'Registrar una venta en mostrador y su cobro desde una caja abierta.',
    label: 'Venta directa',
    group: 'Ventas',
    permission: permissions.salesCreate,
    element: <DirectSale />,
  },
  {
    path: 'caja',
    description: 'Abrir caja, registrar movimientos y efectuar el cierre y arqueo.',
    label: 'Caja',
    group: 'Ventas',
    permission: permissions.cashManage,
    element: <CashRegister />,
  },
  {
    path: 'pagos',
    description: 'Revisar pagos y confirmar abonos manuales después de verificarlos.',
    label: 'Pagos',
    group: 'Ventas',
    permission: permissions.paymentsConfirm,
    element: <PaymentsAdmin />,
  },
  {
    path: 'reclamaciones',
    description: 'Atender las hojas del Libro de Reclamaciones dentro del plazo legal.',
    label: 'Libro de Reclamaciones',
    group: 'Ventas',
    permission: permissions.ordersManage,
    element: <ComplaintsAdmin />,
  },
  {
    path: 'facturacion',
    description:
      'Preparar y consultar comprobantes. Incluye configuración de series y solicitudes de anulación según el estado del documento.',
    label: 'Comprobantes',
    group: 'Facturación',
    permission: permissions.invoicesSubmit,
    element: <BillingAdmin />,
  },
  {
    path: 'reportes/ventas',
    description: 'Consultar ventas, pagos y diferencias de conciliación.',
    label: 'Ventas y conciliación',
    group: 'Reportes',
    permission: permissions.reportsView,
    element: <SalesReport />,
  },
  {
    path: 'reportes',
    description:
      'Consultar disponibilidad y valor a precio de venta de los productos publicados; no es el reporte financiero.',
    label: 'Resumen del catálogo',
    group: 'Reportes',
    element: <ReportsAdmin />,
  },
  {
    path: 'usuarios',
    description:
      'Consultar cuentas y gestionar el alta, validación, suspensión y recuperación de acceso del personal administrador.',
    label: 'Usuarios',
    group: 'Seguridad',
    permission: permissions.usersManage,
    element: <UsersAdmin />,
  },
  {
    path: 'actividad',
    description: 'Consultar el historial de acciones del personal.',
    label: 'Actividad del personal',
    group: 'Seguridad',
    permission: permissions.auditView,
    element: <ActivityAdmin />,
  },
];
