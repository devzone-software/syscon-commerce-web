# APIs necesarias en `syscon-commerce-platform`

Funciones que la web no puede ofrecer porque el backend todavía no expone los datos u
operaciones. La web **no simula** ninguna de ellas. Los contratos son propuestas para acordar con
el equipo del backend; los permisos siguen el formato `recurso:accion` de la plataforma.

El backend es hoy la aplicación Laravel de `syscon-commerce-platform` (reemplazó a los servicios
Java). Los contratos ya implementados están en `syscon-commerce-platform/docs/API-CONTRATOS.md`.
Revisado el 14 de octubre de 2026.

## Ya resuelto en la plataforma

- Reserva de stock al crear el pedido, consumo al pagar y liberación al cancelar o vencer.
- Confirmación de pago y cambio de estado del pedido en una sola transacción.
- Bandejas paginadas de pedidos y pagos (`/api/admin/orders`, `/api/admin/payments`).
- Datos de facturación y entrega en el pedido, costo de envío calculado en el servidor e idempotencia.
- Serie y correlativo asignados por el backend; XML UBL con IGV por línea y documento; notas con motivo.
- PDF, XML y CDR descargables; el cliente ve los comprobantes aceptados de sus pedidos.
- Reportes de ventas, pendientes, comprobantes y conciliación (`/api/admin/reports/*`).
- Venta directa del personal con cobro y entrega inmediatos (`/api/admin/sales`); falta caja con apertura y cierre.

## Hallazgos pendientes

| Prioridad | Hallazgo                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| ALTO      | El envío se dirige a SUNAT, no a un OSE, y no se ha validado contra el servicio beta.                       |
| MEDIO     | Los endpoints `/api/*/internal/**` solo los protege `X-Service-Token`; restringirlos por red en producción. |

## Catálogo — `catalog-service`

| Endpoint                                                   | Método         | Request                                                       | Response                                                                     | Motivo                                                                                                                                        |
| ---------------------------------------------------------- | -------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/catalog/products`                                    | GET            | `?q&category&brand&available&sort&page&size`                  | `{ items: ProductView[], total, page, size }`                                | Hoy devuelve la lista completa y la web filtra y pagina en el navegador; no escala.                                                           |
| `/api/catalog/admin/products`                              | GET            | `?q&active&page&size` (permiso `catalog:write`)               | Página de `ProductView` con inactivos                                        | Un producto desactivado desaparece del backoffice y solo se reactiva conociendo su SKU.                                                       |
| `/api/catalog/categories/{id}`, `/api/catalog/brands/{id}` | PATCH / DELETE | `{ name }`                                                    | `{ id, name }`                                                               | Categorías y marcas se crean al guardar productos, pero no se pueden corregir ni eliminar.                                                    |
| `ProductView.description`                                  | —              | campo nuevo                                                   | `description: string \| null`                                                | El detalle de producto no tiene descripción.                                                                                                  |
| `ProductView.unit`                                         | —              | campo nuevo                                                   | `unit: string` (por ejemplo `NIU`, `MTR`)                                    | No existe unidad de medida; también la necesita el XML UBL.                                                                                   |
| `/api/catalog/products/{id}`                               | DELETE         | (`catalog:write`)                                             | —                                                                            | No se puede eliminar ni archivar un producto, ni retirar los datos demo sin SQL manual.                                                       |
| `/api/catalog/products/bulk`                               | POST           | `{ items: ProductInput[], mode: "upsert" }` (`catalog:write`) | `{ created, updated, errors: [{ index, sku, message }] }` en una transacción | La carga masiva de la web hace una petición por fila: sin atomicidad, lenta en archivos grandes y cada fila repite la verificación de sesión. |
| Almacenamiento de imágenes                                 | POST           | archivo de imagen                                             | `{ imageUrl }`                                                               | Hoy solo se guarda una URL externa (`image_url` varchar 255).                                                                                 |
| `POST /api/catalog/products`                               | POST           | quitar `stock` del alta cuando exista inventario              | —                                                                            | El stock debe cambiar solo mediante movimientos.                                                                                              |

## Sucursales, almacenes e inventario — servicio nuevo o extensión de `catalog-service`

| Endpoint                                       | Método     | Request                                                                                  | Response                                                 | Motivo                                      |
| ---------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| `/api/branches`                                | GET / POST | `{ name, address, code }` (`branches:manage`)                                            | `Branch[]` / `Branch`                                    | No existen sucursales.                      |
| `/api/inventory/warehouses`                    | GET / POST | `{ branchId, name }` (`inventory:manage`)                                                | `Warehouse[]` / `Warehouse`                              | No existen almacenes.                       |
| `/api/inventory/stock`                         | GET        | `?warehouseId&productId&page`                                                            | `[{ productId, warehouseId, available, reserved }]`      | Hoy hay un único saldo global por producto. |
| `/api/inventory/movements`                     | POST       | `{ type: ENTRY\|EXIT\|ADJUSTMENT, warehouseId, productId, quantity, reason, reference }` | `Movement`                                               | Entradas, salidas y ajustes trazables.      |
| `/api/inventory/transfers`                     | POST       | `{ fromWarehouseId, toWarehouseId, lines: [{ productId, quantity }] }`                   | `Transfer`                                               | Transferencias entre almacenes.             |
| `/api/inventory/kardex`                        | GET        | `?productId&warehouseId&from&to`                                                         | `[{ date, type, quantity, balance, reference, userId }]` | Kardex por producto.                        |
| `/api/inventory/reservations`                  | POST       | `{ orderId, warehouseId, lines }`                                                        | `Reservation`                                            | Reservar stock al crear el pedido.          |
| `/api/inventory/reservations/{orderId}/commit` | POST       | —                                                                                        | `Movement[]`                                             | Descontar al pagar.                         |
| `/api/inventory/reservations/{orderId}`        | DELETE     | —                                                                                        | —                                                        | Liberar al cancelar o vencer.               |

## Clientes — `customer-service` (nuevo)

| Endpoint                     | Método    | Request                                                                                      | Response             | Motivo                                                                 |
| ---------------------------- | --------- | -------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `/api/customers`             | GET       | `?q&page&size` (`customers:read`)                                                            | Página de `Customer` | No existe entidad cliente; el pedido guarda solo el UUID de la cuenta. |
| `/api/customers`             | POST      | `{ documentType, documentNumber, name, email, phone, address, userId? }` (`customers:write`) | `Customer`           | Clientes con DNI/RUC para facturar y vender en tienda.                 |
| `/api/customers/{id}`        | GET / PUT | datos del cliente                                                                            | `Customer`           | Detalle y edición.                                                     |
| `/api/customers/{id}/orders` | GET       | `?page`                                                                                      | Página de pedidos    | Historial del cliente.                                                 |
| `/api/customers/me`          | GET / PUT | datos propios                                                                                | `Customer`           | Perfil y datos de facturación del cliente web.                         |

## Pedidos y ventas — `order-service`

| Endpoint                                    | Método | Request       | Response    | Motivo                                                                                                             |
| ------------------------------------------- | ------ | ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `OrderView.channel`, `branchId`, `sellerId` | —      | campos nuevos | —           | Filtrar y reportar pedidos por canal, sucursal y vendedor.                                                         |
| `/api/orders/{id}/cancel`                   | POST   | `{ reason }`  | `OrderView` | Hoy solo se cancela antes del pago (libera la reserva); después del pago se requiere nota de crédito y devolución. |

## Pagos — `payment-service`

| Endpoint                                             | Método         | Request                                                            | Response                   | Motivo                                                             |
| ---------------------------------------------------- | -------------- | ------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `/api/payments`                                      | GET            | `?orderId` (dueño o `payments:confirm`)                            | `Payment[]`                | La web no puede consultar el pago de un pedido sin conocer su ID.  |
| Proveedores `CASH`, `CARD`, `YAPE` y pagos múltiples | POST           | `{ orderId, provider, amount, reference }` por personal autorizado | `Payment`                  | Cobro en tienda; hoy solo el dueño del pedido puede crear el pago. |
| Mercado Pago / Culqi                                 | POST + webhook | según pasarela                                                     | `Payment` con `paymentUrl` | Pago en línea sin confirmación manual.                             |

## Punto de venta y caja — nuevo

| Endpoint                           | Método | Request                                                      | Response                                   | Motivo                                                                                                                           |
| ---------------------------------- | ------ | ------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `/api/pos/sessions`                | POST   | `{ branchId, registerId, openingAmount }` (`cash:open`)      | `CashSession`                              | Apertura de caja.                                                                                                                |
| `/api/pos/sessions/current`        | GET    | —                                                            | `CashSession`                              | Caja abierta del cajero.                                                                                                         |
| `/api/pos/sessions/{id}/movements` | POST   | `{ type: IN\|OUT, amount, reason }`                          | `CashMovement`                             | Ingresos y egresos de caja.                                                                                                      |
| `/api/pos/sessions/{id}/close`     | POST   | `{ countedAmount }` (`cash:close`)                           | `{ expected, counted, difference }`        | Cierre y arqueo.                                                                                                                 |
| `/api/pos/sales`                   | POST   | `{ sessionId, customerId?, lines, payments[] }` (`pos:sell`) | `{ order, payments, movements, invoice? }` | Venta presencial: `POST /api/orders` usa la cuenta autenticada como cliente, así que un vendedor no puede venderle a un tercero. |

## Facturación — `invoice-service`

| Endpoint                                                             | Método     | Request                                                 | Response                | Motivo                                                                                       |
| -------------------------------------------------------------------- | ---------- | ------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `/api/invoices`                                                      | GET        | `?orderId&type&status&from&to&page` (`invoices:submit`) | Página de `InvoiceView` | Bandeja de comprobantes; hoy se abren desde su pedido o por ID.                              |
| `/api/invoices/series`                                               | GET / POST | `{ branchId, type, series }`                            | `Series`                | Series por sucursal (hoy son globales).                                                      |
| Código QR en la representación impresa                               | —          | —                                                       | —                       | Hoy el PDF muestra el valor resumen de la firma.                                             |
| Puerto `ElectronicDocumentProvider` con adaptador del OSE contratado | —          | —                                                       | —                       | Reemplaza el envío directo a SUNAT; incluye resumen diario de boletas si el OSE lo requiere. |

## Usuarios, roles y permisos — `auth-service`

| Endpoint                     | Método     | Request                                                   | Response                                      | Motivo                                                               |
| ---------------------------- | ---------- | --------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `/api/auth/users`            | GET / POST | `?q&page` / `{ email, password, roles }` (`users:manage`) | Página de usuarios / `User`                   | No hay administración de usuarios.                                   |
| `/api/auth/users/{id}/roles` | PUT        | `{ roles: string[] }`                                     | `User`                                        | Asignar vendedor, almacén, etc.                                      |
| `/api/auth/roles`            | GET / POST | `{ name, permissions: string[] }`                         | `Role`                                        | Hoy solo existen `ADMIN` y `CUSTOMER`, creados por código.           |
| `/api/auth/me`               | GET        | —                                                         | `{ id, email, roles, permissions, branches }` | Hoy devuelve solo el UUID; el correo lo aporta la sesión de Laravel. |
| `/api/auth/password-reset`   | POST       | `{ email }` y confirmación con token                      | —                                             | Recuperación de contraseña.                                          |

Roles propuestos y sus permisos:

| Rol         | Permisos                                                                                |
| ----------- | --------------------------------------------------------------------------------------- |
| `SELLER`    | `pos:sell`, `customers:read`, `customers:write`, `orders:manage` limitado a su sucursal |
| `CASHIER`   | `pos:sell`, `payments:collect`, `cash:open`, `cash:close`                               |
| `WAREHOUSE` | `inventory:manage`, `catalog:write`                                                     |
| `ADMIN`     | todos                                                                                   |

La web ya decide los accesos por permiso (`resources/js/lib/auth.ts`, `requirePermission` en
Laravel), así que los roles nuevos funcionarán sin cambios en la lógica de autorización.

## Reportes

| Endpoint                   | Método | Request                                    | Response                                       | Motivo                                                                                                  |
| -------------------------- | ------ | ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `/api/admin/reports/sales` | GET    | `groupBy=product\|branch\|seller\|channel` | `[{ key, orders, units, total }]`              | Ya existen ventas por día y conciliación; faltan agrupaciones por producto, sucursal, vendedor y canal. |
| `/api/pos/sessions/report` | GET    | `?from&to&branchId`                        | `[{ session, expected, counted, difference }]` | Reporte de caja.                                                                                        |
| `ProductView.cost`         | —      | campo nuevo                                | —                                              | Valorizar inventario a costo; hoy solo se puede a precio de venta.                                      |
