import { Link } from 'react-router-dom';
import {
  invoiceFileUrl,
  invoiceStatusLabels,
  invoiceTypeLabel,
  taxPercent,
} from '../../lib/billing';
import { shortId, statusLabel } from '../../lib/orders';
import { paymentMethodLabel } from '../../lib/sales';
import { money } from '../../state';
import type { StoreSale, Invoice } from '../../types';
import { ErrorBox } from '../../ui';

/** Outcome of the sale and of the optional receipt submission. */
export function SaleResult({
  sale,
  invoice,
  invoiceError,
  change,
  onNew,
}: {
  sale: StoreSale;
  invoice: Invoice | null;
  invoiceError: string;
  change: number;
  onNew: () => void;
}) {
  return (
    <section className="bo-card form-stack" aria-labelledby="sale-done-title">
      <h2 id="sale-done-title">Venta registrada</h2>
      <p className="notice success" role="status">
        Pedido {shortId(sale.id)} cobrado con {paymentMethodLabel(sale.payment?.provider ?? '')} por{' '}
        {money(Number(sale.total))} y entregado.
        {change > 0 && ` Vuelto: ${money(change)}.`}
      </p>
      {sale.taxes && (
        <p className="muted">
          Op. gravada {money(Number(sale.taxes.taxableAmount))} · IGV {taxPercent(sale.taxes.rate)}{' '}
          {money(Number(sale.taxes.taxAmount))}
        </p>
      )}
      {invoice && (
        <p className={invoice.status === 'ACCEPTED' ? 'notice success' : 'notice'}>
          {invoiceTypeLabel(invoice.type)} {invoice.serialNumber}:{' '}
          {statusLabel(invoiceStatusLabels, invoice.status)}
          {invoice.sunatDescription && ` — ${invoice.sunatDescription}`}
          {invoice.error && ` — ${invoice.error}`}{' '}
          <a href={invoiceFileUrl(invoice.id, 'pdf')} target="_blank" rel="noopener">
            Ver / imprimir PDF
          </a>
        </p>
      )}
      {invoiceError && (
        <ErrorBox
          message={`La venta se registró, pero el comprobante no: ${invoiceError}. Puedes emitirlo desde Comprobantes.`}
        />
      )}
      <div className="form-actions">
        <Link className="link-button" to={`/admin/pedidos?id=${sale.id}`}>
          Ver pedido
        </Link>
        {!invoice && (
          <Link className="link-button" to={`/admin/facturacion?pedido=${sale.id}`}>
            Emitir comprobante
          </Link>
        )}
        <button type="button" className="button button-primary" onClick={onNew}>
          Nueva venta
        </button>
      </div>
    </section>
  );
}
