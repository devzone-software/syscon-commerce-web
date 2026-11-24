# Revisión visual local — 7 de noviembre de 2026

## Alcance

Aplicación en `http://127.0.0.1:8081`, rama `work/syscon-local`. Capturas completas y revisión del contenido visible de 37 rutas en escritorio de 1440 px y móvil de 390 px, incluyendo redirección de selección y página no encontrada. Comprobaciones adicionales a 320 px y estados de formularios abiertos.

- Tienda: inicio, catálogo, categorías, ficha, carrito vacío y con producto, acceso, registro personal y empresa, recuperación, nosotros, contacto y checkout.
- Cuenta: resumen, pedidos, carrito, productos, contacto y nosotros; menú móvil abierto y cerrado.
- Administración: panel, mi acceso, productos, nuevo producto, importación/exportación, categorías, proveedores, existencias, compras, uso interno, pedidos y detalle de un pedido local pagado, venta directa vacía y con producto, caja cerrada, pagos, comprobantes y preparación desde pedido, reportes, usuarios y actividad.
- La cuenta de superadministración usó una sesión local real. Los perfiles cliente y administrador se simularon en la respuesta de identidad del navegador para comprobar su presentación y navegación. Esto no acredita permisos efectivos de API para esas identidades.

## Problemas encontrados y corregidos

1. Detalle del pedido: su tabla medía 527 px en una pantalla de 390 px. Las líneas ahora se presentan como tarjetas móviles con cantidad, precio y subtotal, manteniendo los totales debajo. Se reutiliza tanto en cuenta como en administración.
2. Menú móvil de cuenta: al abrirse tapaba el control de apertura y no respondía a Escape. Ahora tiene cierre visible, fondo exterior para cerrar, bloqueo del desplazamiento del fondo, retorno de foco y recorrido de teclado dentro del menú. El menú cerrado queda fuera de la interacción en móvil.
3. Cabecera móvil de cuenta: logo, ayuda y carrito se repartían de manera irregular entre filas. Ahora tienen posiciones estables; el logo permite regresar a la tienda. El acceso textual a la tienda se conserva en escritorio y tableta.
4. Comparación a 320 px: los encabezados largos fragmentaban demasiado las palabras. Ahora se agrupa por característica, con valores identificados para el producto actual y el modelo seleccionado.

## Resultado de la comprobación final

- Menú: cierre con Escape, botón de cierre y toque fuera; foco recuperado tras Escape.
- Comparación, registro de empresa y venta directa con producto: sin desbordamiento general a 320 px.
- Detalle de pedido: sin tabla fuera del ancho en la comprobación posterior a 390 px.
- Cobro deshabilitado con caja cerrada, también después de añadir un producto al formulario.
- Consulta de producto con nombre y SKU precargados.
- Sin excepciones JavaScript registradas en los recorridos comprobados.
- Compilación TypeScript/Vite y `git diff --check` satisfactorios.

## Datos y límites de esta revisión

Hay productos demo sin descripción o características publicadas; la interfaz lo informa. La entrega a domicilio no está habilitada en la configuración local revisada. La dirección y horario de retiro son textos de coordinación, no una dirección física confirmada. Esos datos requieren contenido/configuración real del negocio.

El pedido local pagado revisado no tenía un comprobante emitido. No se verificaron archivos tributarios aceptados reales ni cobros, emisiones o movimientos de inventario. Las interacciones del navegador no guardaron operaciones comerciales; las solicitudes de escritura quedaron bloqueadas después del inicio de sesión.

Las capturas y registros temporales están en `/tmp/syscon-visual-review`. No se añadieron capturas ni herramientas de auditoría a los archivos de producción.
