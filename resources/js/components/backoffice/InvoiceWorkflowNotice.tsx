export function InvoiceWorkflowNotice() {
  return (
    <section className="bo-card" aria-labelledby="invoice-workflow-title">
      <h2 id="invoice-workflow-title">Antes de preparar un comprobante</h2>
      <p>
        Si la venta ya tiene comprobante en el servicio habitual de SYSCON, consúltalo allí para no
        duplicarlo.
      </p>
      <p className="muted">
        Crear un borrador no confirma el envío ni la aceptación. Revisa la respuesta y los archivos
        del comprobante; los documentos de prueba no tienen valor tributario.
      </p>
    </section>
  );
}
