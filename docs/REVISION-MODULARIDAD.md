# Revisión de modularidad y mantenimiento del frontend

Fecha: 7 de noviembre de 2026. Alcance: cambios recientes, código compartido y estilos relacionados. No se modificaron el backend, los contratos de API ni las funcionalidades.

## Criterio

- Una responsabilidad reconocible por módulo; las páginas coordinan componentes y datos.
- Reutilizar lógica cuando ya hay consumidores reales. Evitar componentes que solo envuelvan una línea o frameworks nuevos para resolver tareas pequeñas.
- Conservar únicamente el estado que cambia; derivar el resto de las props o los datos recibidos.
- Centralizar reglas de formato, validación y navegación cuando se comparten. Los permisos siguen viniendo del servidor.
- Mantener los estilos de cada componente en un lugar predecible y evitar reglas posteriores que sobrescriban silenciosamente las anteriores.
- Menos líneas no demuestra mayor rendimiento. Las mejoras de velocidad requieren medición.

Referencias primarias: [Thinking in React](https://react.dev/learn/thinking-in-react), [TypeScript: tipos de uso cotidiano](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html), [MDN: cascada CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction).

## Mejoras realizadas

- `catalog.ts` comparte la lectura de características publicadas entre la ficha y la comparación. Conserva líneas libres y separa pares completos de nombre/valor; no inventa datos ante campos incompletos.
- El enlace de consulta del producto se construye en una sola función y conserva correctamente caracteres especiales de nombre y SKU.
- `orders.ts` contiene los mensajes para el comprador por estado, sustituyendo la cadena de condicionales anidados en `OrderPage`.
- `DeliveryFields` deja de guardar tarifas que no consumía y evita convertir un importe de número a texto para volver a convertirlo a número.
- Los estilos de la ficha se concentran en `product.css`. Se retiraron sus reglas duplicadas de `flow.css`, conservando los valores visuales efectivos.
- Se eliminó `offers.css` (785 líneas), sin importaciones vigentes. También se quitaron sus selectores residuales de la cuenta. Las rutas de selección siguen abriendo el catálogo filtrado.
- Se actualizaron comentarios de autenticación que todavía atribuían las comprobaciones a servicios Java antiguos.
- Se aprovecharon módulos existentes, sin introducir librerías ni nuevas jerarquías de componentes.

## Qué ya está separado

Facturación usa módulos para preparación, receptor, detalle, acciones, historial y series. Las rutas, descripciones y permisos administrativos se concentran en `sections.tsx`. Las tareas pendientes, formularios de entrega/comprobante y las piezas de producto tienen componentes propios.

## Qué sigue pendiente

La segunda pasada separó nueve módulos con responsabilidades concretas: formulario y preguntas frecuentes de contacto; detalle, historial y notificaciones administrativas de pedidos; resumen de ventas del panel; campos compartidos de autenticación; selector de cliente y resultado de venta directa. Las páginas conservan la coordinación de navegación, filtros y operaciones principales. No se cambiaron los datos enviados ni los permisos.

| Página | Antes de esta separación | Después |
| --- | --- | --- |
| Contacto | 555 líneas | 360 líneas |
| Bandeja de pedidos | 537 líneas | 207 líneas |
| Venta directa | 497 líneas | 354 líneas |
| Autenticación | 505 líneas | 429 líneas |
| Panel de trabajo | 225 líneas | 134 líneas |

La disminución de cada página corresponde principalmente a código trasladado a módulos. No se presenta como una reducción equivalente del código total ni como evidencia de más velocidad. Se retiró una importación sin uso y se habilitaron `noUnusedLocals` y `noUnusedParameters` para que la compilación detecte nuevas variables, importaciones y parámetros innecesarios.

El contenido estático de páginas como Nosotros puede seguir en su página mientras sea fácil de mantener. Los CSS de catálogo, cuenta y administración siguen siendo grandes y contienen reglas acumuladas. Conviene limpiar y separar por responsabilidad al trabajar en cada área, con comprobación visual, evitando una reescritura global que arriesgue el diseño actual.

## Validación

Pasaron 26 pruebas de catálogo, pedidos y entrega, incluyendo casos de características incompletas y enlaces con caracteres especiales. Compilación y comprobación de espacios satisfactorias. La comparación automatizada de la ficha antes y después a 1440, 880, 390 y 320 px mantuvo el texto y las posiciones/estilos medidos de los 57 elementos revisados. No se afirma que este control cubra todos los estados y datos posibles.

Tras separar los módulos pasaron las 103 pruebas existentes (17 archivos). La comparación antes/después de contacto, ingreso, registro, panel, venta directa y detalle de pedido a 1440 y 390 px conservó el texto, los campos y los rectángulos medidos en las 12 vistas. No se guardaron operaciones comerciales para efectuar esta comprobación.
