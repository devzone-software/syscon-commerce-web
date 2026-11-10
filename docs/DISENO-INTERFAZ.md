# Criterios de interfaz de SYSCON

La interfaz conserva la marca y el flujo comercial existente. Estas reglas permiten revisar las decisiones del equipo y de las herramientas de generación con una base común.

## Fundamentos y componentes

`resources/css/foundations.css` concentra colores, radios y espacios. Se importa una sola vez desde `app.css`; las páginas deben consumir sus variables.

Escala de separación: 4, 8, 12, 16, 24, 32, 48 y 64 px. Elegir el espacio según la relación:

| Relación                        | Base                                  |
| ------------------------------- | ------------------------------------- |
| Etiqueta y campo, icono y texto | 8 px                                  |
| Campos consecutivos             | 16 px                                 |
| Interior de tarjeta             | 24 px; 16 px hasta 700 px de pantalla |
| Entre tarjetas administrativas  | 24 px                                 |
| Entre secciones                 | 32–48 px                              |
| Margen lateral de contenido     | 24 px; 16 px hasta 700 px             |

Los formularios de acceso tienen 32 px interiores en escritorio y 24 px verticales / 16 px horizontales en móvil. Su ancho máximo de 940 px responde al contenido, mientras que el comercial conserva 1200 px. No fijar alturas de tarjetas para igualar textos de diferente longitud.

`syscon.css` define los botones generales y mensajes. `ui.css` define campos, grupos de formulario y tablas. Las variantes específicas de compra y controles compactos conservan sus estilos propios. Evitar redefinir `.button` en páginas: usar una variante explícita cuando su función lo justifique.

Las tarjetas compactas del catálogo usan 16 px interiores en escritorio y 12 px hasta 560 px, para conservar dos columnas legibles en móvil. El botón de agregar mantiene al menos 44 px de altura. Los botones de avance de compra usan 48 px. Las filas del carrito y las opciones de comprobante comparten un radio de 12 px y 16 px de relleno. Estas variantes responden a la densidad y función de cada componente.

## Color y lectura

- Marca y acción principal: `--syscon-brand-primary` (#00265d).
- Texto principal: `--syscon-text-primary` (#111827).
- Ayudas, placeholders y texto secundario sobre fondos claros: `--syscon-text-secondary` (#59616c). No añadir opacidad a texto activo.
- Éxito, advertencia y error: variables `--syscon-success`, `--syscon-warning` y `--syscon-danger`, acompañadas por una etiqueta explícita.
- Controles generales: radio de 8 px. Tarjetas: radio de 12 px.
- Las tablas, campos e importes deben tener una superficie estable y legible.

El contraste de #59616c sobre blanco es aproximadamente 6.27:1. Cada nueva combinación necesita su propia medición; esta cifra no certifica toda la aplicación. WCAG AA pide 4.5:1 para texto normal y 3:1 para texto grande según la definición del criterio.

## Material de referencia

- [Carbon: espacios](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview): escala y agrupación. Los valores elegidos aquí son decisiones de SYSCON.
- [Atlassian: retícula](https://atlassian.design/foundations/grid) y [color](https://atlassian.design/foundations/color/).
- [Figma Auto Layout en español](https://help.figma.com/hc/es-es/articles/5731482952599-A%C3%B1adir-el-dise%C3%B1o-autom%C3%A1tico-a-un-dise%C3%B1o): ejercicios para construir tarjetas y formularios.
- [W3C: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [Baymard: formularios de ecommerce](https://baymard.com/blog/form-design): investigación de usabilidad.
- [Bagisto](https://github.com/bagisto/bagisto) y [su documentación de pedidos](https://docs.bagisto.com/orders/orders): organización funcional de ecommerce.
- Facturación peruana: seguir la [guía de operación del backend](https://github.com/devzone-software/syscon-commerce-platform/blob/work/syscon-local/docs/deployment/OPERACION.md) y las [guías de SUNAT](https://cpe.sunat.gob.pe/guias-y-manuales). Un estilo visual coherente no acredita validación tributaria.

## Revisión antes de extender un componente

Comprobar móvil y escritorio; etiquetas y nombres largos; estado vacío y con contenido; error de validación y foco visible con teclado. Revisar pantallas después de navegar entre módulos, porque sus CSS se cargan bajo demanda. Ajustar primero el componente compartido y revisar sus consumidores antes de sumar excepciones.

## Navegación administrativa y responsabilidades

Las 17 rutas administrativas y sus permisos se definen en `resources/js/pages/backoffice/sections.tsx`. El contenedor `Backoffice.tsx` se ocupa de la distribución y el acceso; las herramientas secundarias conservan su ruta y su autorización, aunque se agrupen bajo Productos en el menú.

`CatalogToolsNav` comparte los accesos a Productos, Importar / exportar y Categorías y marcas. La importación mantiene la actualización por SKU y la exportación de stock físico existentes.

Comprobantes prioriza el acceso desde Pedidos. La búsqueda por ID, la emisión manual por ID y las series se mantienen disponibles en apartados desplegables. Al entrar con `?pedido=`, el formulario se muestra y toma los datos del pedido como antes. `InvoiceSeriesPanel` conserva las operaciones y validaciones de series en un componente independiente.

Nombres comunes para tienda y cuenta: Mis pedidos y Administración. Las entradas de inventario se llaman Compras a proveedores y Retiros para uso interno. Esta organización no modifica los roles, pagos, stock, cálculos ni procesamiento tributario.

Referencias técnicas: [Thinking in React](https://react.dev/learn/thinking-in-react) para separar componentes por responsabilidad, y [React Router: navegación](https://reactrouter.com/start/declarative/navigating) para indicar el destino activo sin duplicar estado de navegación.

## Módulos de facturación

La página `pages/backoffice/BillingAdmin.tsx` coordina la navegación y la carga de series. Los componentes de `components/backoffice/` tienen responsabilidades delimitadas:

| Archivo                     | Responsabilidad                                                |
| --------------------------- | -------------------------------------------------------------- |
| `InvoiceForm.tsx`           | Emisión y precarga desde el pedido, incluyendo notas.          |
| `InvoiceDetail.tsx`         | Consulta, líneas, totales y acciones disponibles según estado. |
| `InvoiceActionForms.tsx`    | Corrección de borradores y solicitud de anulación.             |
| `InvoiceCustomerFields.tsx` | Campos de identidad compartidos por emisión y corrección.      |
| `InvoiceHistory.tsx`        | Historial de envíos y anulaciones.                             |
| `InvoiceSeriesPanel.tsx`    | Configuración de series y correlativos.                        |

`lib/billing.ts` conserva las validaciones y transformaciones puras compartidas. Los componentes usan `services/api.ts` para mantener los mismos contratos HTTP. La extracción conserva las funciones existentes y no cambia las reglas de pagos, stock ni comprobantes.

## Pagos y checkout adaptables

`PaymentList` presenta los mismos pagos en tabla de escritorio y en tarjetas hasta 1200 px. Las tarjetas mantienen visibles importe, medio, estado y acción, incluidos correos y referencias largos. El filtro móvil conserva los cinco estados del servicio existente. La acción se llama «Verificar abono» para un pago manual pendiente y «Ver estado» en los demás casos; no cambia quién puede confirmar ni cómo lo hace.

El checkout usa dos columnas desde 1000 px, con el resumen lateral; por debajo se apila. Sus estilos están limitados a `.checkout-layout`, para conservar la distribución del carrito y del detalle de pedidos. Los datos, cálculos, validaciones, creación de pedido y solicitud de pago siguen usando los contratos existentes. El botón anticipa la modalidad elegida: pedido con pago manual, continuación a Mercado Pago o pago de prueba.

Estas mejoras se limitan a React y CSS; no añaden endpoints ni cambian la lógica del backend. Referencias: [Shopify, acciones claras por tarea](https://shopify.dev/docs/apps/design/navigation) y [Baymard, presentación de medios y redirecciones](https://baymard.com/blog/payment-ux).

## Propiedad de los estilos comunes

- `app.css`: importaciones, reset y utilidades generales, con reglas legibles.
- `syscon.css`: botones generales, controles, foco, mensajes y etiquetas de estado.
- `ui.css`: campos agrupados, tablas y listas de detalle.
- `product.css`: detalle de producto y breadcrumb compartido.
- `flow.css`: variantes del proceso de compra.

Se retiraron las definiciones duplicadas de etiquetas de estado en `ui.css`, controles y marca en `app.css`, y títulos de sección en `flow.css`. Las variantes específicas conservan sus selectores. Antes de mover otra regla, comprobar el estilo calculado en sus consumidores y después de navegar entre módulos para no alterar la cascada accidentalmente.

## Inicio orientado a encontrar productos

El inicio presenta cuatro productos y sus precios después del carrusel, seguidos por el acceso al catálogo completo y las categorías. Mantiene las mismas fichas, búsqueda, filtros y confirmación al agregar al carrito. El funcionamiento automático y manual del carrusel se conserva.

El acceso «Catálogo desde…» calcula el menor precio actual entre productos activos y disponibles mediante `lowestAvailablePrice`. Abre el catálogo con disponibilidad y orden por precio aplicados; el comprador puede modificar esos filtros. Sin productos disponibles se muestra un enlace al catálogo general. Un precio bajo no se etiqueta como descuento.

Las ofertas reales requieren datos comerciales de promoción y vigencia que todavía no existen en el modelo actual de producto. La posición de promociones debe validarse con compradores de SYSCON; la investigación externa sustenta facilitar el acceso, pero no establece una ubicación universal. Referencias: [Baymard, acceso a ofertas como filtro](https://baymard.com/research-articles/sales-filter-based-category) y [Perfil del comprador online, Impronta, junio de 2025](https://drive.google.com/file/d/1M8h12XkKVC-tUCa9CI9a5LS7CSjHkpy-/view).


## Revisión de estabilidad y contenido (noviembre 2026)

- Productos usa tarjetas hasta 1200 px; precio, disponible, físico/reservado y Editar deben quedar visibles. La tabla se conserva en escritorio.
- `ContentDisclosure` presenta información secundaria sin eliminar sus enlaces, formularios o anclas. Un enlace a Historia abre su sección antes de desplazarla.
- Todas las categorías siguen accesibles en la lista principal. Las marcas no deben rotularse como subcategorías.
- Los carruseles mantienen controles de 32 px para indicadores y una pausa persistente de 44 px. La pausa del usuario es independiente de la pausa temporal por foco o puntero.
- `Loading` reserva una región con bloques estáticos; no añade animaciones continuas. Las listas de pagos y productos conservan sus datos durante una actualización mediante `useData(..., ..., { keepPreviousData: true })` y anuncian el estado. Esta opción no debe aplicarse a fichas de entidades distintas, donde mostrar datos anteriores puede confundir.
- `.container.checkout-layout` tiene mayor especificidad que el contenedor genérico para conservar el margen entre banner y formulario.
- Los contactos compartidos se leen de `company`. El teléfono de WhatsApp existente se conserva, pendiente de validación por la empresa; no se inventó otro.
- Los ajustes visuales de esta revisión están delimitados por componente en `refinements.css`. No deben extenderse mediante selectores generales de tablas o controles.


## Pedidos y comprobantes: recorrido visual

- La entrada a Comprobantes usa `BillingOrderPicker`, que consulta la API existente de pedidos administrativos y respeta el permiso `orders:manage`.
- El usuario busca por cliente/documento/pedido y filtra entre los cuatro estados de pedidos que el sistema ya permite facturar. Los resultados conservan la paginación del servidor; no se aplica filtrado a una sola página como si fuera el catálogo completo.
- Cada resultado distingue estado del pedido y estado del comprobante. Si ya existe uno, la acción abre ese documento; de lo contrario, lleva a revisar y preparar los datos. Seleccionar no emite ni confirma pagos.
- Las búsquedas por identificador, la preparación manual y la configuración de series siguen disponibles como herramientas secundarias. Los roles sin acceso a pedidos conservan las herramientas que ya tenían autorizadas.
- En documentos del cliente, PDF es la acción principal. XML y CDR se conservan bajo Archivos electrónicos; la constancia solo se ofrece cuando existe.
- Referencias de organización: [Falabella, documentos dentro del detalle de compra](https://assets.falabella.com/v3/assets/blt088e6fffbba20f16/bltc31f9d9758af444f/667999be26e415775f2845a6/index.html), [WooCommerce, listado y filtros de pedidos](https://woocommerce.com/document/managing-orders/overview-and-bulk-management/), [Shopify, estados separados](https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status). Se adapta la organización a SYSCON; no se asume que sus procesos fiscales sean equivalentes.
- Validación: compilación, 99 pruebas unitarias y seis vistas con datos representativos, búsqueda, filtro, paginación y acceso a archivos. Las pruebas de interfaz interceptan los datos y no emiten comprobantes ni registran operaciones reales.

## Adaptación de la referencia Heveya

La referencia se aplica a jerarquía, superficies claras y compra legible, conservando el azul y los activos de SYSCON. El carrusel conserva sus controles y muestra productos y precios del catálogo existente. El diálogo nativo de confirmación se presenta como panel lateral; mantiene cantidades, confirmación, Escape y retorno del foco. No se copian fotografías, promociones ni reglas comerciales de Heveya.

`storefront-polish.css` contiene la presentación de tienda. `operational-tables.css` adapta las tablas marcadas con `responsive-table`: una sola fila conserva sus acciones y pasa a tarjeta con etiquetas en móvil. Los formularios de compra y venta directa mantienen sus campos y operaciones.

El checkout distingue carga de error en la consulta de entrega, con reintento independiente del perfil. Reintentar no sustituye los datos que escribió el comprador. Venta directa deshabilita y protege el envío mientras no haya caja abierta o su consulta falle; el backend sigue siendo la autoridad. Registrar una compra recibida continúa incrementando el stock, ahora explicado antes de guardar.

Contacto y Nosotros usan Juliaca/Puno y las actividades documentadas. Se retiraron la calle de San Isidro, coordenadas y cronología no sustentadas. La dirección exacta de retiro debe confirmarse con la empresa. Estos cambios no conectan proveedores de pago ni certifican la integración SUNAT.
