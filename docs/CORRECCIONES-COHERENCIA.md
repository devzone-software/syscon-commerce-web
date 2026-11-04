# Correcciones de catálogo y recorrido de compra

4 de noviembre de 2026. Esta web requiere los cambios de catálogo de Platform documentados en
`docs/CATALOGO-ADMINISTRACION.md` del backend. Desplegar primero la API y ejecutar sus migraciones.

- Administración y carga masiva leen `/web-api/admin/products`. Incluyen productos inactivos y
  distinguen stock físico, reservado y disponible. El editor y el CSV usan stock físico al guardar.
- El CSV acepta `description` y `specifications` opcionales. Omitir esas columnas conserva los
  datos existentes; una celda vacía en una columna presente los vacía.
- Los detalles se editan en Productos y se muestran como texto en la ficha pública. Si no se han
  cargado, se invita a consultar al equipo, sin presentar marca y SKU como especificaciones.
- Los productos inactivos no se pueden comprar, incluso desde un enlace guardado. El carrito
  comprueba también `active` y conserva el bloqueo de productos retirados del catálogo.
- `/ofertas` conserva su URL, pero se presenta como selección de productos por precio. No
  representa descuentos ni campañas con vencimiento.
- El checkout ofrece pago manual y la pasarela que la API tenga habilitada. El pedido usa el
  proveedor seleccionado; si la pasarela falla después de crearlo, se recupera desde su detalle.
- La cuenta usa `paymentMethods` del pedido; no muestra un medio supuesto. Un pedido cancelado
  o vencido no se anuncia como pago confirmado al volver de la pasarela.
- En móvil, el catálogo tiene un solo buscador. La búsqueda de Mi cuenta se identifica como
  búsqueda de productos. El formulario de contacto prepara un correo, sin anunciar un envío web.

Las condiciones comerciales y los datos de contacto deben ser confirmados por el equipo de
Syscon; los campos de descripción se rellenan con información real del producto.
