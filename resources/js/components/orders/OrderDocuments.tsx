import { invoiceFileUrl, invoiceTypeLabel } from '../../lib/billing';
import { formatDateTime } from '../../lib/orders';
import { api } from '../../services/api';
import { money } from '../../state';
import { useData, ErrorBox, Loading } from '../../ui';

/** Statuses after payment, when the order can have a receipt. */
export const BILLABLE = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

/** Receipts of a paid order that the customer can open or download. */
export function OrderDocuments({ orderId }: { orderId: string }) {
  const { data, error, loading, reload } = useData(() => api.orderInvoices(orderId), [orderId]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!data?.length)
    return (
      <p className="flow-note">
        Tu comprobante aparecerá aquí cuando sea emitido y aceptado por SUNAT.
      </p>
    );
  return (
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
              Ver PDF
            </a>
            <a className="link-button" href={invoiceFileUrl(invoice.id, 'xml', orderId)} download>
              XML
            </a>
            {invoice.hasCdr && (
              <a className="link-button" href={invoiceFileUrl(invoice.id, 'cdr', orderId)} download>
                CDR
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
