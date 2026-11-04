#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
destination="${1:-$project_root/dist/syscon-web-hostinger.zip}"
php_bin="${PHP_BIN:-php}"
composer_bin="${COMPOSER_BIN:-composer}"
npm_bin="${NPM_BIN:-npm}"

command -v "$php_bin" >/dev/null
command -v "$composer_bin" >/dev/null
"$php_bin" -r 'if (PHP_VERSION_ID < 80300 || !extension_loaded("zip")) { fwrite(STDERR, "Se requiere PHP 8.3 y ZIP.\n"); exit(1); }'

# Los assets se compilan aquí: el hosting no necesita Node ni node_modules.
if [[ "${SKIP_ASSETS:-0}" != "1" ]]; then
    (cd -- "$project_root" && "$npm_bin" run build)
fi
[[ -f "$project_root/public/build/manifest.json" ]] || { echo "Falta public/build: ejecuta npm run build." >&2; exit 1; }

stage="$(mktemp -d)"
trap 'rm -rf -- "$stage"' EXIT
mkdir -p "$stage/export/syscon-web" "$stage/export/public_html" "$(dirname -- "$destination")"

# Solo entra el código de la aplicación: ni .env, ni node_modules, ni fuentes TS/CSS (ya compiladas).
for path in app bootstrap config public routes artisan composer.json composer.lock; do
    cp -R -- "$project_root/$path" "$stage/export/syscon-web/"
done
mkdir -p "$stage/export/syscon-web/resources"
cp -R -- "$project_root/resources/views" "$stage/export/syscon-web/resources/"
cp -- "$project_root/.env.hostinger.example" "$stage/export/syscon-web/.env.example"
find "$stage/export/syscon-web/bootstrap/cache" -maxdepth 1 -type f -name '*.php' -delete
rm -f -- "$stage/export/syscon-web/public/hot"
mkdir -p "$stage/export/syscon-web/storage/"{app/private,app/public,framework/cache/data,framework/sessions,framework/views,logs}

(
    cd -- "$stage/export/syscon-web"
    "$composer_bin" install --no-dev --prefer-dist --no-interaction --no-scripts --optimize-autoloader --classmap-authoritative
    "$php_bin" artisan package:discover --ansi
)
cp -R -- "$stage/export/syscon-web/public/." "$stage/export/public_html/"
rm -rf -- "$stage/export/syscon-web/public/build"
cp -- "$project_root/deploy/hostinger/index.php" "$stage/export/public_html/index.php"
"$php_bin" "$project_root/bin/zip-hostinger.php" "$stage/export" "$destination"
printf 'Paquete creado: %s\n' "$destination"
