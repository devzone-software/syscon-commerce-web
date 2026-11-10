import { invoiceFileUrl, invoiceTypeLabel } from '../../lib/billing';
import { formatDateTime } from '../../lib/orders';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData, ErrorBox, Loading } from '../../ui';

/** Statuses after payment, when the order can have a receipt. */
export const BILLABLE = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

/** Receipts of a paid order that the customer can open or download. */
export function OrderDocuments({
  orderId,
  automation,
}: {
  orderId: string;
  automation?: string | null;
}) {
  const { data, error, loading, reload } = useData(
    () => api.orderInvoices(orderId),
    [orderId, automation],
    { keepPreviousData: true },
  );
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!data?.length)
    return (
      <div className="customer-document-pending">
        <p className="flow-note" role="status">
          {automation === 'REVIEW'
            ? 'Tu pago está confirmado. El comprobante necesita una revisión del equipo; te avisaremos cuando esté disponible.'
            : automation === 'PENDING' || automation === 'PROCESSING'
              ? 'Tu pago está confirmado. Estamos tramitando tu comprobante; aparecerá aquí cuando SUNAT confirme su aceptación.'
              : 'Tu comprobante aparecerá aquí cuando sea emitido y aceptado por SUNAT.'}
        </p>
        <button type="button" className="link-button" onClick={reload}>
          Consultar comprobante
        </button>
      </div>
    );
  return (
    <div className="customer-order-documents">
      <ul className="document-list">
        {data.map((invoice) => (
          <li key={invoice.id}>
            <div>
              <strong>
                {invoiceTypeLabel(invoice.type)} {invoice.serialNumber}
              </strong>
              <small>
                {money(Number(invoice.total))}
                {invoice.createdAt && ` · ${formatDateTime(invoice.createdAt)}`}
                {invoice.referencedSerialNumber && ` · modifica ${invoice.referencedSerialNumber}`}
              </small>
              {invoice.test && (
                <small className="field-error">Documento de prueba, sin valor tributario.</small>
              )}
            </div>
            <div className="document-actions">
              <a
                className="flow-button"
                href={invoiceFileUrl(invoice.id, 'pdf', orderId)}
                target="_blank"
                rel="noopener"
              >
                Ver comprobante PDF
              </a>
              <details className="document-technical">
                <summary>Archivos electrónicos</summary>
                <p className="flow-note">
                  PDF: representación para leer o imprimir. XML: archivo electrónico del
                  comprobante. CDR: respuesta de recepción de SUNAT; su contenido informa el
                  resultado.
                </p>
                <a
                  className="link-button"
                  href={invoiceFileUrl(invoice.id, 'xml', orderId)}
                  download
                >
                  XML
                </a>
                {invoice.hasCdr && (
                  <a
                    className="link-button"
                    href={invoiceFileUrl(invoice.id, 'cdr', orderId)}
                    download
                  >
                    Constancia de recepción (CDR)
                  </a>
                )}
              </details>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
