# SYSCON Commerce Web

Aplicación Laravel 12 + React 19 + TypeScript + Tailwind para el backend [SYSCON Commerce Platform](https://github.com/devzone-software/syscon-commerce-platform). Laravel actúa como proxy de las API Java y guarda el JWT y el refresh token en una sesión cifrada del servidor. El navegador solo recibe la cookie de sesión `HttpOnly` y usa CSRF para las mutaciones.

## Funciones

**Tienda pública**

- Home con categorías, selección de productos y marcas calculadas del catálogo real.
- Catálogo con búsqueda sin tildes, filtros por categoría, marca y disponibilidad, orden y paginación.
- Detalle de producto con cantidad limitada por stock y productos relacionados.
- Carrito persistente que sincroniza precio y stock con el catálogo y bloquea productos no disponibles.
- Checkout con pago `MANUAL` y página de pedido con estado, detalle y solicitud de pago.
- Cuenta del cliente: resumen, pedidos recientes y listado filtrable.

**Backoffice** (`/admin`, layout propio, secciones visibles según permisos)

| Sección | Permiso |
| --- | --- |
| Panel, reportes de catálogo e inventario | cualquier permiso de personal |
| Productos, carga masiva CSV, categorías y marcas, existencias | `catalog:write` |
| Proveedores (sincronización de feeds) | `suppliers:manage` |
| Pedidos (consulta por ID y cambio de estado) | `orders:manage` |
| Pagos (consulta por ID y confirmación manual) | `payments:confirm` |
| Comprobantes (emisión, consulta y envío) | `invoices:submit` |

POS, caja, sucursales, almacenes, movimientos, kardex, clientes, listados globales y reportes de
ventas dependen de APIs que el backend aún no ofrece. Están detalladas en
[docs/API-NECESARIAS.md](docs/API-NECESARIAS.md); la web no las simula.

## Requisitos

- PHP 8.3, Composer 2, Node 22 y npm, o Docker Engine con Compose.
- Backend SYSCON disponible a través de su Nginx. `JAVA_API_URL` es una URL **interna al servidor Laravel**, no una variable del navegador.

## Desarrollo local

```bash
cp .env.example .env
composer install
php artisan key:generate
npm ci
```

Inicia `npm run dev` en una terminal y `php artisan serve` en otra. Abre
`http://127.0.0.1:8000` en el navegador; el puerto 5173 es solo para los
recursos de Vite. Si quieres ejecutar únicamente `php artisan serve`, detén
Vite y ejecuta `npm run build` antes de abrir la página.

Configura `JAVA_API_URL` en `.env` antes de probar datos reales. Si Laravel se ejecuta fuera de Docker y el backend publica Nginx en el puerto 80, usa `JAVA_API_URL=http://localhost`. El `JWT_SECRET` debe coincidir exactamente con el del Auth Service y tener al menos 32 bytes aleatorios; Laravel lo usa para verificar la firma HS256 y las autoridades del token. No uses variables `VITE_*` para estos secretos. `APP_KEY` debe ser única y persistente.

El proyecto no guarda usuarios, productos, pedidos ni pagos en una base Laravel. Las sesiones y la caché usan archivos. El precio, el stock, el total y las transiciones de estado los decide el backend Java.

## Docker y Hostinger VPS

```bash
cp .env.example .env
# Edita APP_ENV=production, APP_DEBUG=false, APP_URL=https://tu-dominio,
# JAVA_API_URL y JWT_SECRET; pega una APP_KEY persistente generada previamente.
docker compose build
docker compose up -d
```

La web escucha solo en `127.0.0.1:8081`. En Hostinger VPS coloca Nginx o Caddy del host delante con certificado TLS y proxy a ese puerto; configura renovación del certificado y redirección HTTP→HTTPS. Usa `SESSION_SECURE_COOKIE=true`, `APP_ENV=production` y `APP_DEBUG=false` en producción. El proxy Java debe ser accesible desde el contenedor; `host.docker.internal` se resuelve al host mediante `host-gateway` en Compose. Si el backend corre en otra red o servidor, ajusta `JAVA_API_URL` y restringe su acceso por red. Conserva el volumen `sessions` durante despliegues para no cerrar sesiones activas.

Para generar `APP_KEY` sin PHP instalado en el host, ejecuta `docker run --rm php:8.3-cli php -r 'echo "base64:".base64_encode(random_bytes(32)).PHP_EOL;'` y copia el resultado a `.env`. El archivo `.env` no se incluye en la imagen; Compose inyecta sus valores al iniciar el contenedor.

`docker-compose.yml` construye el código PHP y los assets, copia estos últimos a un volumen de solo lectura para Nginx y no expone PHP-FPM. Para probar localmente, visita `http://localhost:8081` y cambia `APP_URL` a esa dirección. Antes de publicar, comprueba también las limitaciones operativas del backend descritas en su README, especialmente reserva de stock concurrente, homologación SUNAT y pasarelas de pago.

## Verificación

```bash
php artisan test
npm test
npm run format:check
npm run build
```

## Datos demo (solo desarrollo local)

`scripts/demo/catalog-demo.jsonl` contiene 25 productos ficticios con SKU `DEMO-` y marcas
ficticias con prefijo `Demo`. `scripts/demo/seed-catalog.sh` los carga en el stack Docker de
`syscon-commerce-platform` usando el upsert por SKU que ya expone catalog-service para
importaciones (`POST /api/catalog/internal/products`); la petición se ejecuta dentro del
contenedor `catalog`, que ya tiene `SERVICE_TOKEN`.

```bash
scripts/demo/seed-catalog.sh              # carga o restablece los productos demo (idempotente)
scripts/demo/seed-catalog.sh --unpublish  # los oculta del catálogo (active=false)
```

Requiere el servicio `catalog` en ejecución; `SYSCON_PLATFORM_DIR` indica otra ruta de la
plataforma (por defecto `../syscon-commerce-platform`). Volver a ejecutarlo restablece precio y
stock de los productos demo. El backend no tiene endpoint para eliminar productos. No lo ejecutes
contra producción.

## Rutas del BFF (`/web-api`)

Laravel valida la entrada, conserva el JWT en la sesión y aplica el mismo permiso que el servicio
Java (`requirePermission`), sin depender del nombre del rol.

| Ruta web | API Java | Acceso |
| --- | --- | --- |
| `GET catalog/{products,categories,brands}`, `GET product/{id}` | `/api/catalog/...` | Público (caché de 60 s) |
| `POST register`, `login`, `logout`; `GET me` | `/api/auth/...` | `me` devuelve roles y permisos |
| `GET/POST orders`, `GET orders/{id}` | `/api/orders` | Sesión |
| `POST payments`, `GET payments/{id}` | `/api/payments` | Sesión; solo proveedor `MANUAL` |
| `POST admin/products` | `POST /api/catalog/products` | `catalog:write` |
| `PATCH admin/orders/{id}/status` | `PATCH /api/orders/{id}/status/{status}` | `orders:manage` |
| `POST admin/payments/{id}/confirm` | `POST /api/payments/{id}/confirm` | `payments:confirm` |
| `POST admin/invoices`, `GET admin/invoices/{id}`, `POST admin/invoices/{id}/submit` | `/api/invoices` | `invoices:submit` |
| `GET/POST admin/suppliers`, `POST admin/suppliers/{id}/run`, `GET admin/supplier-jobs[/{id}/history]` | `/api/suppliers` | `suppliers:manage` |

## Límites conocidos del backend

- El stock solo cambia al guardar un producto o sincronizar un proveedor (ambos **reemplazan** el valor); ningún pedido lo descuenta.
- La sincronización de proveedores sobrescribe precio y stock propios.
- La facturación no está homologada: el XML no incluye IGV y se envía directo a SUNAT, no a un OSE.
- El catálogo devuelve la lista completa; filtros y paginación se hacen en el navegador.
- La carga masiva envía un upsert por fila porque no existe un endpoint masivo ni transaccional.

## Pendientes de integración (entorno local)

- `auth` de la plataforma se reinicia en bucle: `AdminBootstrap` exige `ADMIN_PASSWORD` de al menos 16 caracteres y el `.env` local tiene uno más corto. Mientras no se corrija, no es posible iniciar sesión ni probar el backoffice contra el backend real.
- La imagen Docker de la web (`:8081`) se construyó antes de los cambios de esta rama; debe reconstruirse para ver la interfaz actual.
- Los detalles y los contratos propuestos están en [docs/API-NECESARIAS.md](docs/API-NECESARIAS.md).

## Estructura

- `app/Services/JavaApi.php`: cliente HTTP y rotación de refresh token.
- `app/Services/Identity.php`: validación de firma, emisor y vencimiento del JWT.
- `app/Http/Controllers/Gateway/`: un controlador por módulo (`Auth`, `Catalog`, `Order`, `Payment`, `Invoice`, `Supplier`) sobre una base común con `requirePermission`.
- `resources/js/services/api.ts`: cliente del navegador para `/web-api`.
- `resources/js/state.tsx`: sesión visible y carrito local; las operaciones del carrito están en `lib/cart.ts`.
- `resources/js/lib/`: reglas sin interfaz y con pruebas (catálogo, carrito, pedidos, permisos, facturación, inventario, validaciones).
- `resources/js/components/`: `layout`, `home`, `catalog`, `product`, `cart`, `checkout`, `orders`, `account`, `backoffice` y `shared`.
- `resources/js/pages/`: páginas de la tienda; `pages/backoffice/` contiene el backoffice.
- `resources/css/`: `app.css` (base) importa los estilos por área (`home`, `catalog`, `product`, `cart`, `ui`, `checkout`, `account`, `backoffice`).
- `infra/nginx.conf`, `Dockerfile`, `docker-compose.yml`: despliegue.
