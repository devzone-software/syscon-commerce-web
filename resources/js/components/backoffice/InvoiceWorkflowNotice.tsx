export function InvoiceWorkflowNotice() {
  return (
    <details className="bo-card invoice-workflow-help">
      <summary>Antes de emitir: evita comprobantes duplicados</summary>
      <p>
        Si la venta ya tiene comprobante en el servicio habitual de SYSCON, consúltalo allí para no
        duplicarlo.
      </p>
      <p className="muted">
        Crear un borrador no confirma el envío ni la aceptación. Revisa la respuesta y los archivos
        del comprobante; los documentos de prueba no tienen valor tributario.
      </p>
    </details>
  );
}
