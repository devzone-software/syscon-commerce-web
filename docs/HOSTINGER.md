# Despliegue de la tienda en Hostinger compartido

Alternativa ligera al despliegue con Docker: no necesita VPS, Node ni procesos permanentes. La tienda va en el dominio principal (`tu-dominio.com`) y la plataforma en un subdominio (`api.tu-dominio.com`), instalada según `docs/deployment/HOSTINGER.md` de syscon-commerce-platform.

La web no tiene base de datos: sesiones y caché van en archivos. Necesita PHP 8.3 o superior con las extensiones que exige Laravel (cURL, Mbstring, OpenSSL, Fileinfo).

## 1. Construir el paquete

En la máquina de desarrollo, con `node_modules` instalado:

```bash
bash bin/build-hostinger.sh
```

El script compila los assets (`npm run build`), instala Composer sin dependencias de desarrollo y con autoload optimizado, y genera `dist/syscon-web-hostinger.zip` (~7 MB). No incluye `.env`, `node_modules` ni las fuentes TS/CSS. Con `SKIP_ASSETS=1` reutiliza un `public/build` ya compilado.

## 2. Subir y extraer

Extrae el ZIP en el directorio del dominio. Sus dos carpetas quedan como hermanas:

```text
/home/u123456789/domains/tu-dominio.com/
├── syscon-web/      (aplicación, vendor, storage, .env)
└── public_html/     (index.php, .htaccess y build/)
```

En una actualización conserva `syscon-web/.env` y `syscon-web/storage`; reemplaza `public_html/build` completo, porque los nombres de los assets cambian en cada versión.

## 3. Configurar `.env`

Copia `syscon-web/.env.example` a `syscon-web/.env` y completa:

- `APP_URL=https://tu-dominio.com`
- `PLATFORM_API_URL=https://api.tu-dominio.com`
- `JWT_SECRET`: el mismo valor que en la plataforma.
- `GOOGLE_CLIENT_ID`, si se usa el inicio de sesión con Google.

En la plataforma, `WEB_URL` debe apuntar a `https://tu-dominio.com`.

## 4. Inicializar por SSH

```bash
cd /home/u123456789/domains/tu-dominio.com/syscon-web
php artisan key:generate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Repite los tres `cache` después de cada cambio del `.env` o actualización. `storage` y `bootstrap/cache` deben ser escribibles por PHP; no uses permisos 777.

## 5. Verificar

- `/` carga la tienda y `/catalogo` muestra productos (la web llega a la plataforma).
- Iniciar sesión y abrir "Mi cuenta" funciona (sesión en archivos y `JWT_SECRET` correctos).
- `/build/assets/*` responde con `Cache-Control: public, max-age=31536000, immutable` y comprimido (lo configura `public_html/.htaccess`).
- `syscon-web/.env` no es accesible desde el navegador.
