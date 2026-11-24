# Referencias para continuar el frontend de SYSCON

Revisión: 7 de noviembre de 2026. Investigación y propuestas; no implica integrar estas plataformas ni cambiar el backend.

## Base de SYSCON

- [Plan de negocio digital](https://docs.google.com/document/d/1Zs-FsHV9wUoQedq0qpdC-yt17XGqrOX5/edit): instituciones educativas y microempresas de Juliaca como público prioritario; venta de tecnología, licencias y servicios; courier nacional y servicios en Puno. Describe uso actual de Keyfacil mediante OSE y propone emisión propia. Esa propuesta no demuestra que la integración ya esté aprobada u operativa.
- [Análisis](https://docs.google.com/document/d/1Z5kMhV4uVuqZI_WAhuYfysxrmILZo6kcxnArF32L634/edit): modalidad de emisión pendiente de validación DP-01.
- [Implementación](https://docs.google.com/document/d/1k2vJ4Gxjw4r4mcsybt0fEAHpTwzyf73i9Nbv6MOSzrg/edit): conservar estados independientes de venta, comprobante y respuesta; no atribuir habilitación tributaria a la presencia de clases de emisión.

## Referencias y adaptación propuesta

| Referencia | Patrón observado | Aplicación propuesta |
| --- | --- | --- |
| [Heveya](https://www.heveya.sg/) | Comparación de productos, ayuda para elegir, consulta con especialista y acceso a condiciones de garantía | Ayudar a elegir tecnología por necesidad y compatibilidad. Mostrar comparaciones solo con características publicadas. Conservar azul y cian de SYSCON. |
| [Saleor Storefront](https://github.com/saleor/storefront) | Componentes de checkout, carrito, ficha, confirmación y cuenta; variables de diseño | Revisar cómo divide responsabilidades y estados de interacción; adaptar a React actual sin incorporar Next.js, GraphQL ni pasarelas nuevas por copiar el ejemplo. |
| [Shopify: estado del pedido](https://help.shopify.com/en/manual/fulfillment/setup/order-status-page) | Página que reúne seguimiento y actualizaciones de envío | Mostrar qué ocurrió, qué sigue y qué acción puede realizar el comprador. Publicar tracking y fecha solo cuando los servicios aporten esos datos. |
| [WooCommerce: pantalla del pedido](https://woocommerce.com/document/managing-orders/view-edit-or-add-an-order/) | Resumen de número, fecha, pago, estado, cliente, facturación y entrega | Priorizar el resumen operativo en administración y dejar configuración menos frecuente en paneles secundarios. |
| [WooCommerce: facturas PDF](https://woocommerce.com/document/woocommerce-pdf-invoice-setup-and-customization/) | Descarga del documento desde confirmación e historial | Mantener el acceso desde Mis pedidos. La factura PDF del ejemplo internacional no acredita aceptación tributaria peruana. |
| [SUNAT: consultas](https://ww1.sunat.gob.pe/ol-ti-itreciboelectronico/consultavalidez1.jsp) | Consulta oficial de validez | Orientar al comprador a consultar cuando corresponda; no mostrar validación automática si no se realizó. |

El [starter anterior de Medusa](https://github.com/medusajs/nextjs-starter-medusa) aparece archivado desde el 2 de julio de 2026. Puede servir para estudiar patrones, pero no se recomienda incorporarlo como base mantenida. La [documentación de confirmación de pedido](https://docs.medusajs.com/resources/storefront-development/checkout/order-confirmation) sigue siendo una referencia de estructura; sus reglas de acceso no deben copiarse sin evaluar los contratos de SYSCON.

## YouTube y material audiovisual

- [Canal oficial de SUNAT](https://www.youtube.com/user/sunatvideos1), enlazado desde su [página de videos y audios CPE](https://cpe.sunat.gob.pe/node/150): fuente para contrastar conceptos y modalidad de emisión con material oficial vigente.
- [Tutorial de preparación de pedidos Shopify](https://www.youtube.com/watch?v=0Pmi-L5VJqA): localizado por título y descripción; no se verificó la reproducción íntegra. Útil como demostración visual complementaria, sin tomarlo como autoridad tributaria ni justificar cambios de arquitectura.

## Próximas mejoras propuestas

1. Un resumen claro del pedido con pago, preparación/entrega y comprobante como información independiente; mostrar solo los estados disponibles.
2. En comprobantes, acciones con nombres comprensibles y ayuda breve sobre PDF, XML y CDR cuando los archivos existan. Mantener visibles los avisos de documentos de prueba y aceptación pendiente.
3. Consultas de producto con nombre y SKU precargados, para que el cliente no vuelva a escribir su contexto.
4. Guías para elegir y comparación técnica basadas en datos reales del catálogo. Evitar reseñas, descuentos, certificaciones o urgencia inventados.
5. Completar las condiciones comerciales con contenido aprobado de la empresa y priorizar los datos que necesita el comprador antes de pagar.

La compra invitada, nuevas cotizaciones, tracking automático, emisión con Keyfacil y nuevas autorizaciones requieren contratos o decisiones del equipo correspondiente. No se simularán mediante botones que aparenten ejecutar esas operaciones.
