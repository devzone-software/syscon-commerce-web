#!/usr/bin/env bash
# Loads the DEMO catalog into the local Docker stack of syscon-commerce-platform.
# LOCAL DEVELOPMENT ONLY: never run it against production.
#
# It reuses the upsert that catalog-service already exposes for imports
# (POST /api/catalog/internal/products, the same one supplier-service calls), so it is
# idempotent: products are matched by SKU and categories/brands by name.
# The request runs inside the catalog container, which already has SERVICE_TOKEN;
# the token is never read or printed by this script.
#
# Usage:
#   scripts/demo/seed-catalog.sh              load or refresh the DEMO products
#   scripts/demo/seed-catalog.sh --unpublish  hide every DEMO product (active=false)
#
# SYSCON_PLATFORM_DIR overrides the platform checkout (default: ../syscon-commerce-platform).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_dir="$(cd "$here/../.." && pwd)"
platform_dir="${SYSCON_PLATFORM_DIR:-$web_dir/../syscon-commerce-platform}"
data="$here/catalog-demo.jsonl"

mode=seed
case "${1:-}" in
  "") ;;
  --unpublish) mode=unpublish ;;
  *) echo "Opción desconocida: $1" >&2; exit 2 ;;
esac

[ -f "$platform_dir/compose.yml" ] || { echo "No se encontró $platform_dir/compose.yml (define SYSCON_PLATFORM_DIR)." >&2; exit 1; }
platform() { docker compose --project-directory "$platform_dir" -f "$platform_dir/compose.yml" "$@"; }

if ! platform ps --status running --services | grep -qx catalog; then
  echo "El servicio catalog de syscon-commerce-platform no está en ejecución." >&2
  exit 1
fi

# Guard: only DEMO- SKUs are ever sent, whatever the data file contains.
payload="$(tr -d '\r' < "$data" | grep -E '^\{"sku":"DEMO-[^"]+"')"
if [ "$mode" = unpublish ]; then
  payload="$(printf '%s\n' "$payload" | sed 's/"active":true/"active":false/')"
fi
total="$(printf '%s\n' "$payload" | grep -c .)"
echo "Enviando $total productos DEMO a catalog-service (modo: $mode)…"

result="$(printf '%s\n' "$payload" | platform exec -T catalog sh -c '
  while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue
    sku=$(printf "%s" "$line" | sed -n "s/.*\"sku\":\"\([^\"]*\)\".*/\1/p")
    out=$(printf "%s" "$line" | curl -sS -X POST \
      -H "Content-Type: application/json" -H "X-Service-Token: $SERVICE_TOKEN" \
      --data-binary @- -w "\n%{http_code}" http://localhost:8082/api/catalog/internal/products)
    code=$(printf "%s" "$out" | tail -n 1)
    if [ "$code" = 200 ]; then echo "OK $sku"; else echo "ERROR $sku HTTP $code $(printf "%s" "$out" | head -n 1)"; fi
  done
')"
printf '%s\n' "$result"

ok="$(printf '%s\n' "$result" | grep -c '^OK ' || true)"
echo "Resultado: $ok de $total productos procesados correctamente."

# The web BFF caches the catalog for 60 seconds; clear it when the web stack is running.
if docker compose --project-directory "$web_dir" ps --status running --services 2>/dev/null | grep -qx app; then
  for kind in products categories brands; do
    docker compose --project-directory "$web_dir" exec -T app php artisan cache:forget "catalog.$kind" >/dev/null 2>&1 || true
  done
  echo "Caché de catálogo de la web limpiada."
fi

[ "$ok" = "$total" ]
