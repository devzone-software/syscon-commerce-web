# Responsabilidades y accesos: adaptación de la interfaz

## Base documental

- [Análisis de SYSCON](https://docs.google.com/document/d/1Z5kMhV4uVuqZI_WAhuYfysxrmILZo6kcxnArF32L634/edit): actores del negocio y decisión pendiente DP-07.
- [Diseño funcional y UX/UI, apartado 3](https://docs.google.com/document/d/1Hx305BvkdxmLfvcbKnh0r7Z7speS5ssJvAtav-st6uQ/edit): perfiles de referencia; permisos definitivos pendientes.
- [Plan de negocio digital v4](https://docs.google.com/document/d/1Zs-FsHV9wUoQedq0qpdC-yt17XGqrOX5/edit): roles técnicos SUPERADMIN, ADMIN y CUSTOMER; RF10, RF11 y RF13.

Administración, ventas, almacén y facturación describen responsabilidades. No se equiparan automáticamente a cuentas distintas ni al nombre ADMIN. La interfaz conserva las autorizaciones recibidas del servidor.

## Cambios de frontend

- `sections.tsx` concentra rutas, nombres, descripciones de tareas y permisos requeridos. Las descripciones identifican qué se hace en catálogo, inventario, ventas, facturación, reportes y seguridad.
- La nueva página `/admin/mi-acceso` recibe la misma lista filtrada de secciones que usa Backoffice. No contiene una segunda matriz de roles, no consulta datos de otros empleados y no solicita accesos adicionales.
- Los enlaces de esa página solo abren tareas ya autorizadas. Describe también el alcance sensible de Comprobantes, porque el permiso actual incluye configuración de series y solicitudes de anulación.
- Panel permite consultar el acceso de la cuenta. Caja presenta el acceso a Venta directa solo cuando existe `sales:create`; en caso contrario ofrece consultar el alcance de la cuenta.
- Una ruta existente sin permiso identifica la tarea no habilitada y orienta al usuario. Una ruta desconocida presenta un mensaje distinto. El rechazo sigue impidiendo montar la sección y sus consultas.
- Resumen del catálogo solo ofrece el enlace a Existencias si existe `catalog:write`. Este ajuste también cubre perfiles de permisos reducidos que puedan incorporarse más adelante.
- El área cliente sigue siendo para las compras propias de cada usuario. Ser personal de SYSCON no convierte los pedidos propios en la bandeja de todos los compradores.

## Diferencias que requieren una decisión de autorización

| Operación | Plan comercial | Permiso vigente | Trabajo que corresponde coordinar |
|---|---|---|---|
| Venta en mostrador | RF11: ADMIN | `sales:create`, actualmente SUPERADMIN | Conciliar con DP-07 y habilitar en servidor si se aprueba; la interfaz mostrará el acceso al recibirlo. |
| Compras y recepción | RF10: ADMIN | `inventory:manage`, actualmente SUPERADMIN | Definir quién registra la compra/recepción y su alcance antes de cambiar permisos. |
| Reportes financieros y actividad | RF13: ADMIN | `reports:view` y `audit:view`, actualmente SUPERADMIN | Precisar qué datos puede consultar cada puesto. El resumen del catálogo público es otra función. |
| Series y anulación | Autorizaciones sensibles pendientes | Agrupadas bajo `invoices:submit` | Determinar si requieren un permiso separado para supervisión. |

No se conceden estos accesos mediante botones, cambios de etiquetas, permisos inventados ni simulaciones de identidad en la aplicación real. Los cambios efectivos corresponden al responsable del backend una vez conciliada la matriz. Las simulaciones utilizadas en comprobaciones locales prueban únicamente el comportamiento visual del frontend.

## Referencias de organización

- [WooCommerce: roles y capacidades](https://woocommerce.com/document/roles-capabilities/): separación entre cliente, operación y administración.
- [Shopify: roles](https://help.shopify.com/en/manual/your-account/users/roles): permisos según trabajo y responsabilidad.
- [OWASP: autorización](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): la validación debe existir en servidor; ocultar controles no sustituye autorización.

## Comprobación

Compilación, pruebas existentes y revisión de acceso con cuentas locales y perfiles simulados de permisos reducidos. Los perfiles simulados se interceptan en el navegador de prueba y no cambian roles, sesiones del servidor ni cuentas. No se ejecutan ventas, movimientos, emisiones o cambios de usuarios para comprobar esta adaptación visual.
