# Actualización del frontend — 10 de noviembre de 2026

Incremento sobre el commit 64937a1, ya incluido en la revisión #3.

## Cambios

- Paleta azul marino y celeste, mejoras de contraste y presentación adaptable.
- Catálogo compartido entre inicio, listado y productos relacionados; vista rápida y ampliador de fotos.
- Galerías con lista de imágenes y miniaturas compartidas entre componentes.
- Navegación de cuenta separada del catálogo; enlaces directos y redirección antigua que conserva filtros.
- Recorridos más claros en carrito, checkout, pedidos y autenticación; etiquetas de compras personales del personal.
- Presentación de pagos, comprobantes y avisos de correo basada en la información disponible, sin afirmar recepción de mensajes.
- Editor de imagen por URL e importación por CSV usando las operaciones existentes del catálogo.
- Limpieza de estilos y enlaces ocultos sin uso.

## Alcance de esta revisión

Solo frontend y fotografías de ejemplo. No incluye controladores, rutas PHP, configuración del servidor, migraciones ni cambios de la plataforma.

La carga de archivos y la escritura de galerías que requieren nuevas rutas o contratos del servidor se conservan localmente y no se incluyen aquí. El editor publicado en esta revisión usa el campo imageUrl existente. Las galerías públicas aceptan imageUrls opcional y funcionan con una sola imagen cuando el servidor no lo entrega.

Las fotos de los productos de ejemplo son ilustrativas; sus fuentes se registran en public/examples/catalog-photos/SOURCES.json. No certifican la correspondencia de modelo o marca con inventario comercial real.

## Validación

- npm run build: correcto (TypeScript y Vite).
- npm test: 20 archivos, 116 pruebas correctas.
- git diff --check: correcto.
- En el entorno local se verificaron navegación y filtros, selección de fotos, ampliador y vista rápida en escritorio y móvil. La variante preparada para revisión se compiló y probó por separado.
