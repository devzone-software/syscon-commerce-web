# SYSCON Commerce Web

Aplicación Laravel 12 + React 19 + TypeScript + Tailwind para el backend [SYSCON Commerce Platform](https://github.com/devzone-software/syscon-commerce-platform). Laravel actúa como proxy de las API Java y guarda el JWT y el refresh token en una sesión cifrada del servidor. El navegador solo recibe la cookie de sesión `HttpOnly` y usa CSRF para las mutaciones.

## Funciones

- Landing, catálogo público, búsqueda, filtros y paginación local; detalle de producto y carrito.
- Registro, login, renovación automática del token, logout y roles `CUSTOMER`/`ADMIN`.
- Creación de pedidos, historial personal, detalle y solicitud de pago `MANUAL`.
- Administración: alta/actualización de producto por SKU, cambio de estado de pedido y confirmación de pago manual mediante ID.
- Estados de carga y error, diseño adaptable y caché de catálogo de 60 segundos.

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

La web escucha solo en `127.0.0.1:8080`. En Hostinger VPS coloca Nginx o Caddy del host delante con certificado TLS y proxy a ese puerto; configura renovación del certificado y redirección HTTP→HTTPS. Usa `SESSION_SECURE_COOKIE=true`, `APP_ENV=production` y `APP_DEBUG=false` en producción. El proxy Java debe ser accesible desde el contenedor; `host.docker.internal` se resuelve al host mediante `host-gateway` en Compose. Si el backend corre en otra red o servidor, ajusta `JAVA_API_URL` y restringe su acceso por red. Conserva el volumen `sessions` durante despliegues para no cerrar sesiones activas.

Para generar `APP_KEY` sin PHP instalado en el host, ejecuta `docker run --rm php:8.3-cli php -r 'echo "base64:".base64_encode(random_bytes(32)).PHP_EOL;'` y copia el resultado a `.env`. El archivo `.env` no se incluye en la imagen; Compose inyecta sus valores al iniciar el contenedor.

`docker-compose.yml` construye el código PHP y los assets, copia estos últimos a un volumen de solo lectura para Nginx y no expone PHP-FPM. Para probar localmente, visita `http://localhost:8080` y cambia `APP_URL` a esa dirección. Antes de publicar, comprueba también las limitaciones operativas del backend descritas en su README, especialmente reserva de stock concurrente, homologación SUNAT y pasarelas de pago.

## Verificación

```bash
php artisan test
npm test
npm run build
```

## Contratos reales y límites

| Función | API Java usada | Estado |
| --- | --- | --- |
| Catálogo | `GET /api/catalog/products`, `categories`, `brands`, `products/{id}` | Operativa |
| Auth | `POST /api/auth/register`, `login`, `refresh`, `logout`; `GET /api/auth/me` | Operativa |
| Pedidos | `GET/POST /api/orders`, `GET /api/orders/{id}` | Operativa para el cliente actual |
| Pagos | `POST /api/payments`, `GET /api/payments/{id}` | Solo proveedor `MANUAL` disponible en Java |
| Admin | `POST /api/catalog/products`, `PATCH /api/orders/{id}/status/{status}`, `POST /api/payments/{id}/confirm` | Operativa con permisos Java |
| Comprobantes del cliente | Ningún endpoint de lista/consulta personal | Pendiente en Java |
| Clientes, pedidos globales y reportes de admin | Ningún endpoint global | Pendiente en Java |
| Mercado Pago / Culqi | Adaptadores no configurados en Java | Pendiente de backend, credenciales y webhooks |
| Rol OPERATOR | No hay asignación ni endpoints de gestión en Auth Service | Pendiente en Java |
| Promociones comerciales | No hay endpoint de promociones | Pendiente en Java; la portada usa solo mensajes generales |

El catálogo Java devuelve una lista completa sin parámetros de búsqueda, filtros o paginación; la web aplica estas operaciones en el navegador. Para catálogos grandes deberá añadirse paginación y búsqueda en Java. El endpoint `/api/auth/me` devuelve solo el ID: el correo visible en la cuenta proviene de la sesión de login; editar perfil requiere un endpoint nuevo. Los pagos manuales se confirman desde administración con el ID y una referencia verificada fuera de esta aplicación.

## Estructura

- `app/Services/JavaApi.php`: cliente HTTP y rotación de refresh token.
- `app/Services/Identity.php`: validación de firma, emisor y vencimiento del JWT.
- `app/Http/Controllers/GatewayController.php`: rutas permitidas, validación y sesión.
- `resources/js/services/api.ts`: cliente del navegador para `/web-api`.
- `resources/js/state.tsx`: sesión visible y carrito local.
- `resources/js/app.tsx`, `pages/`, `ui.tsx`: rutas con carga diferida, páginas y componentes compartidos.
- `infra/nginx.conf`, `Dockerfile`, `docker-compose.yml`: despliegue.
