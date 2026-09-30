# APIs necesarias en `syscon-commerce-platform`

Funciones que la web no puede ofrecer porque el backend Java todavía no expone los datos u
operaciones. La web **no simula** ninguna de ellas. Los contratos son propuestas para acordar con
el equipo del backend; los nombres de permisos siguen el formato `recurso:accion` que ya usan los
servicios con `@PreAuthorize`.

Estado del backend verificado en el commit `7030697` de `syscon-commerce-platform`.

## Hallazgos que motivan los cambios

| Prioridad | Hallazgo | Evidencia |
| --- | --- | --- |
| CRÍTICO | Ningún flujo descuenta stock: el pedido solo lo verifica y el pago no lo modifica. | `order-service/.../OrderService.java` (`create` compara `p.stock()`), `CatalogService.upsert` es la única escritura de `Inventory.available` |
| CRÍTICO | La sincronización de proveedores reemplaza precio y stock propios y publica el producto. | `supplier-service/.../SupplierService.java` → `catalog.upsert(..., stock, ..., true)` |
| ALTO | El XML UBL no incluye `TaxTotal`/IGV y se envía directo a SUNAT, no a un OSE. | `invoice-service/.../UblXmlBuilder.java`, `SunatGateway.sendBill` |
| ALTO | La confirmación de pago marca el pedido como pagado antes de guardar el pago, sin compensación. | `payment-service/.../PaymentService.confirm` |
| MEDIO | Los endpoints `/api/*/internal/**` pasan por el Nginx público; solo los protege `X-Service-Token`. | `infra/nginx/default.conf`, `common/SecurityConfiguration.java` |

## Catálogo — `catalog-service`

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/catalog/products` | GET | `?q&category&brand&available&sort&page&size` | `{ items: ProductView[], total, page, size }` | Hoy devuelve la lista completa y la web filtra y pagina en el navegador; no escala. |
| `/api/catalog/admin/products` | GET | `?q&active&page&size` (permiso `catalog:write`) | Página de `ProductView` con inactivos | Un producto desactivado desaparece del backoffice y solo se reactiva conociendo su SKU. |
| `/api/catalog/categories/{id}`, `/api/catalog/brands/{id}` | PATCH / DELETE | `{ name }` | `{ id, name }` | Categorías y marcas se crean al guardar productos, pero no se pueden corregir ni eliminar. |
| `ProductView.description` | — | campo nuevo | `description: string \| null` | El detalle de producto no tiene descripción. |
| `ProductView.unit` | — | campo nuevo | `unit: string` (por ejemplo `NIU`, `MTR`) | No existe unidad de medida; también la necesita el XML UBL. |
| `/api/catalog/products/{id}` | DELETE | (`catalog:write`) | — | No se puede eliminar ni archivar un producto, ni retirar los datos demo sin SQL manual. |
| `/api/catalog/products/bulk` | POST | `{ items: ProductInput[], mode: "upsert" }` (`catalog:write`) | `{ created, updated, errors: [{ index, sku, message }] }` en una transacción | La carga masiva de la web hace una petición por fila: sin atomicidad, lenta en archivos grandes y cada fila repite la verificación de sesión. |
| Almacenamiento de imágenes | POST | archivo de imagen | `{ imageUrl }` | Hoy solo se guarda una URL externa (`image_url` varchar 255). |
| `POST /api/catalog/products` | POST | quitar `stock` del alta cuando exista inventario | — | El stock debe cambiar solo mediante movimientos. |

## Sucursales, almacenes e inventario — servicio nuevo o extensión de `catalog-service`

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/branches` | GET / POST | `{ name, address, code }` (`branches:manage`) | `Branch[]` / `Branch` | No existen sucursales. |
| `/api/inventory/warehouses` | GET / POST | `{ branchId, name }` (`inventory:manage`) | `Warehouse[]` / `Warehouse` | No existen almacenes. |
| `/api/inventory/stock` | GET | `?warehouseId&productId&page` | `[{ productId, warehouseId, available, reserved }]` | Hoy hay un único saldo global por producto. |
| `/api/inventory/movements` | POST | `{ type: ENTRY\|EXIT\|ADJUSTMENT, warehouseId, productId, quantity, reason, reference }` | `Movement` | Entradas, salidas y ajustes trazables. |
| `/api/inventory/transfers` | POST | `{ fromWarehouseId, toWarehouseId, lines: [{ productId, quantity }] }` | `Transfer` | Transferencias entre almacenes. |
| `/api/inventory/kardex` | GET | `?productId&warehouseId&from&to` | `[{ date, type, quantity, balance, reference, userId }]` | Kardex por producto. |
| `/api/inventory/reservations` | POST | `{ orderId, warehouseId, lines }` | `Reservation` | Reservar stock al crear el pedido. |
| `/api/inventory/reservations/{orderId}/commit` | POST | — | `Movement[]` | Descontar al pagar. |
| `/api/inventory/reservations/{orderId}` | DELETE | — | — | Liberar al cancelar o vencer. |

## Clientes — `customer-service` (nuevo)

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/customers` | GET | `?q&page&size` (`customers:read`) | Página de `Customer` | No existe entidad cliente; el pedido guarda solo el UUID de la cuenta. |
| `/api/customers` | POST | `{ documentType, documentNumber, name, email, phone, address, userId? }` (`customers:write`) | `Customer` | Clientes con DNI/RUC para facturar y vender en tienda. |
| `/api/customers/{id}` | GET / PUT | datos del cliente | `Customer` | Detalle y edición. |
| `/api/customers/{id}/orders` | GET | `?page` | Página de pedidos | Historial del cliente. |
| `/api/customers/me` | GET / PUT | datos propios | `Customer` | Perfil y datos de facturación del cliente web. |

## Pedidos y ventas — `order-service`

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/orders/admin` | GET | `?status&channel&branchId&from&to&page` (`orders:manage`) | Página de `OrderView` | El backoffice solo puede buscar pedidos por ID. |
| `OrderView.createdAt`, `channel`, `branchId`, `sellerId` | — | campos nuevos | — | Ordenar, filtrar y reportar pedidos. `SalesOrder.createdAt` existe pero no se expone. |
| `/api/orders` | POST | `{ items, customer: { documentType, documentNumber, name }, delivery: { method, address } }` | `OrderView` | El checkout no puede guardar datos de entrega ni de facturación. |
| `/api/orders/{id}/cancel` | POST | `{ reason }` | `OrderView` | Hoy solo se cancela antes del pago y sin liberar stock ni devolver el pago. |

## Pagos — `payment-service`

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/payments` | GET | `?orderId` (dueño o `payments:confirm`) | `Payment[]` | La web no puede consultar el pago de un pedido sin conocer su ID. |
| `/api/payments` | GET | `?status=PENDING&page` (`payments:confirm`) | Página de `Payment` | Bandeja de pagos manuales pendientes. |
| Proveedores `CASH`, `CARD`, `YAPE` y pagos múltiples | POST | `{ orderId, provider, amount, reference }` por personal autorizado | `Payment` | Cobro en tienda; hoy solo el dueño del pedido puede crear el pago. |
| Mercado Pago / Culqi | POST + webhook | según pasarela | `Payment` con `paymentUrl` | Pago en línea sin confirmación manual. |

## Punto de venta y caja — nuevo

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/pos/sessions` | POST | `{ branchId, registerId, openingAmount }` (`cash:open`) | `CashSession` | Apertura de caja. |
| `/api/pos/sessions/current` | GET | — | `CashSession` | Caja abierta del cajero. |
| `/api/pos/sessions/{id}/movements` | POST | `{ type: IN\|OUT, amount, reason }` | `CashMovement` | Ingresos y egresos de caja. |
| `/api/pos/sessions/{id}/close` | POST | `{ countedAmount }` (`cash:close`) | `{ expected, counted, difference }` | Cierre y arqueo. |
| `/api/pos/sales` | POST | `{ sessionId, customerId?, lines, payments[] }` (`pos:sell`) | `{ order, payments, movements, invoice? }` | Venta presencial: `POST /api/orders` usa la cuenta autenticada como cliente, así que un vendedor no puede venderle a un tercero. |

## Facturación — `invoice-service`

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/invoices` | GET | `?orderId&type&status&from&to&page` (`invoices:submit`) | Página de `InvoiceView` | Solo se puede consultar un comprobante por su ID. |
| `/api/invoices/mine` | GET | — | `InvoiceView[]` del cliente | La cuenta del cliente no puede mostrar sus comprobantes. |
| `/api/invoices/{id}/pdf`, `/api/invoices/{id}/xml` | GET | — | archivo | Representación impresa y XML firmado. |
| `/api/invoices/series` | GET / POST | `{ branchId, type, series }` | `Series` | Series por sucursal. |
| `POST /api/invoices` sin `serialNumber` | POST | el backend asigna el correlativo | `InvoiceView` | Hoy el correlativo se escribe a mano. |
| UBL con `TaxTotal`, IGV por línea y leyendas | — | — | — | Requisito para que el comprobante sea válido. |
| Puerto `ElectronicDocumentProvider` con adaptador del OSE contratado | — | — | — | Reemplaza el envío directo a SUNAT; incluye resumen diario de boletas si el OSE lo requiere. |

## Usuarios, roles y permisos — `auth-service`

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/auth/users` | GET / POST | `?q&page` / `{ email, password, roles }` (`users:manage`) | Página de usuarios / `User` | No hay administración de usuarios. |
| `/api/auth/users/{id}/roles` | PUT | `{ roles: string[] }` | `User` | Asignar vendedor, almacén, etc. |
| `/api/auth/roles` | GET / POST | `{ name, permissions: string[] }` | `Role` | Hoy solo existen `ADMIN` y `CUSTOMER`, creados por código. |
| `/api/auth/me` | GET | — | `{ id, email, roles, permissions, branches }` | Hoy devuelve solo el UUID; el correo lo aporta la sesión de Laravel. |
| `/api/auth/password-reset` | POST | `{ email }` y confirmación con token | — | Recuperación de contraseña. |

Roles propuestos y sus permisos:

| Rol | Permisos |
| --- | --- |
| `SELLER` | `pos:sell`, `customers:read`, `customers:write`, `orders:manage` limitado a su sucursal |
| `CASHIER` | `pos:sell`, `payments:collect`, `cash:open`, `cash:close` |
| `WAREHOUSE` | `inventory:manage`, `catalog:write` |
| `ADMIN` | todos |

La web ya decide los accesos por permiso (`resources/js/lib/auth.ts`, `requirePermission` en
Laravel), así que los roles nuevos funcionarán sin cambios en la lógica de autorización.

## Reportes

| Endpoint | Método | Request | Response | Motivo |
| --- | --- | --- | --- | --- |
| `/api/orders/reports/sales` | GET | `?from&to&groupBy=day\|product\|branch\|seller\|channel` | `[{ key, orders, units, total }]` | Reportes de ventas. |
| `/api/invoices/reports` | GET | `?from&to&type&status` | `[{ type, status, count, total }]` | Reporte de comprobantes. |
| `/api/pos/sessions/report` | GET | `?from&to&branchId` | `[{ session, expected, counted, difference }]` | Reporte de caja. |
| `ProductView.cost` | — | campo nuevo | — | Valorizar inventario a costo; hoy solo se puede a precio de venta. |
