import { StatusBadge } from '../shared/StatusBadge';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { can, permissions } from '../../lib/auth';
import {
  documentLabel,
  invoiceStatusLabels,
  invoiceTypeLabel,
  invoiceFileUrl,
  invoiceValidity,
  noteReasonFor,
  sendDeadlineNotice,
  taxPercent,
} from '../../lib/billing';
import { formatDateTime, shortId } from '../../lib/orders';
import { limaDate } from '../../lib/reports';
import { api } from '../../services/api';
import { money, useShop } from '../../state';
import { type Invoice } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';
import { VoidForm, CorrectionForm } from './InvoiceActionForms';
import { VoidHistory, AttemptHistory } from './InvoiceHistory';

function InvoiceLines({ invoice }: { invoice: Invoice }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="visually-hidden">Detalle del comprobante</caption>
        <thead>
          <tr>
            <th scope="col">Descripción</th>
            <th scope="col" className="num">
              Cantidad
            </th>
            <th scope="col" className="num">
              Precio con IGV
            </th>
            <th scope="col" className="num">
              Valor sin IGV
            </th>
            <th scope="col" className="num">
              IGV
            </th>
            <th scope="col" className="num">
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {(invoice.lines ?? []).map((line) => (
            <tr key={line.lineNumber}>
              <td>
                <strong>{line.description}</strong>
                {line.sku && <small>SKU {line.sku}</small>}
              </td>
              <td className="num">{line.quantity}</td>
              <td className="num">{money(Number(line.unitPrice))}</td>
              <td className="num">{money(Number(line.taxableAmount))}</td>
              <td className="num">{money(Number(line.taxAmount))}</td>
              <td className="num">{money(Number(line.lineTotal))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={5}>
              Op. gravada
            </th>
            <td className="num">{money(Number(invoice.taxableAmount))}</td>
          </tr>
          <tr>
            <th scope="row" colSpan={5}>
              IGV {taxPercent(invoice.taxRate ?? '0.18')}
            </th>
            <td className="num">{money(Number(invoice.taxAmount))}</td>
          </tr>
          <tr>
            <th scope="row" colSpan={5}>
              Total
            </th>
            <td className="num">
              <strong>{money(Number(invoice.total))}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function InvoiceDetail({ id, notice }: { id: string; notice: string }) {
  const { user } = useShop();
  const { data, loading, error, reload } = useData<Invoice>(() => api.invoice(id), [id]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(notice);
  const [submitError, setSubmitError] = useState('');
  const [correcting, setCorrecting] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage('');
    setSubmitError('');
    try {
      const result = await api.submitInvoice(id);
      setMessage(
        `Envío procesado. Estado: ${invoiceStatusLabels[result.status] ?? result.status}.`,
      );
      reload();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !data)
    return <ErrorBox message={error || 'Comprobante no encontrado.'} retry={reload} />;
  const deadline = sendDeadlineNotice(data.sendDeadline, limaDate(new Date()));
  const canSubmit = (data.status === 'DRAFT' || data.status === 'FAILED') && !deadline?.expired;
  const runAction = async (action: () => Promise<Invoice>, done: string) => {
    setBusy(true);
    setMessage('');
    setSubmitError('');
    try {
      const result = await action();
      setMessage(`${done}. Estado: ${invoiceStatusLabels[result.status] ?? result.status}.`);
      reload();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const reconcile = async () => {
    setBusy(true);
    setMessage('');
    setSubmitError('');
    try {
      const result = await api.reconcileInvoice(id);
      setMessage(
        `Conciliación procesada. Estado: ${invoiceStatusLabels[result.status] ?? result.status}.`,
      );
      reload();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="bo-card" aria-labelledby="invoice-detail-title">
      <div className="order-top">
        <h2 id="invoice-detail-title">
          {invoiceTypeLabel(data.type)} {data.serialNumber}
        </h2>
        <StatusBadge status={data.status} labels={invoiceStatusLabels} />
      </div>
      <dl className="detail-list">
        <div>
          <dt>ID</dt>
          <dd>
            <code>{data.id}</code>
          </dd>
        </div>
        <div>
          <dt>Pedido</dt>
          <dd>
            {can(user, permissions.ordersManage) ? (
              <Link className="link-button" to={`/admin/pedidos?id=${data.orderId}`}>
                {shortId(data.orderId)}
              </Link>
            ) : (
              shortId(data.orderId)
            )}
          </dd>
        </div>
        {data.customerName && (
          <div>
            <dt>Cliente</dt>
            <dd>
              {data.customerName} · {documentLabel(data.customerDocumentType ?? '')}{' '}
              {data.customerDocumentNumber}
            </dd>
          </div>
        )}
        {data.referencedSerialNumber && (
          <div>
            <dt>Modifica a</dt>
            <dd>{data.referencedSerialNumber}</dd>
          </div>
        )}
        {data.noteCode && (
          <div>
            <dt>Motivo</dt>
            <dd>
              {data.noteCode} · {noteReasonFor(data.type, data.noteCode)?.label ?? 'Otro'}
              {data.noteReason && <small> — {data.noteReason}</small>}
            </dd>
          </div>
        )}
        {data.total && !data.lines?.length && (
          <div>
            <dt>Total</dt>
            <dd>{money(Number(data.total))}</dd>
          </div>
        )}
        {data.createdAt && (
          <div>
            <dt>Generado</dt>
            <dd>{formatDateTime(data.createdAt)}</dd>
          </div>
        )}
        {data.sunatCode && (
          <div>
            <dt>Código de respuesta</dt>
            <dd>{data.sunatCode}</dd>
          </div>
        )}
        {data.sunatDescription && (
          <div>
            <dt>Descripción de la respuesta</dt>
            <dd>{data.sunatDescription}</dd>
          </div>
        )}
      </dl>
      {data.lines && data.lines.length > 0 && <InvoiceLines invoice={data} />}
      <p className={data.status === 'ACCEPTED' && !data.test ? 'notice success' : 'notice'}>
        {invoiceValidity(data.status, data.test)}
      </p>
      <div className="form-actions">
        <a
          className="button button-secondary"
          href={invoiceFileUrl(data.id, 'pdf')}
          target="_blank"
          rel="noopener"
        >
          {data.status === 'ACCEPTED' ? 'Ver / imprimir PDF' : 'Vista previa PDF'}
        </a>
        <a className="link-button" href={invoiceFileUrl(data.id, 'xml')} download>
          Descargar XML
        </a>
        {data.hasCdr && (
          <a className="link-button" href={invoiceFileUrl(data.id, 'cdr')} download>
            Descargar CDR
          </a>
        )}
      </div>
      {deadline && (
        <p className={`notice${deadline.expired ? ' error' : ''}`} role="note">
          {deadline.text}
        </p>
      )}
      {data.error && (
        <p className="notice error">
          Último error de envío: {data.error}. El reintento usa el mismo número {data.serialNumber}.
        </p>
      )}
      {message && (
        <p
          className={['ACCEPTED', 'VOIDED'].includes(data.status) ? 'notice success' : 'notice'}
          role="status"
        >
          {message}
        </p>
      )}
      {submitError && <ErrorBox message={submitError} />}
      {data.status === 'DRAFT' &&
        (correcting ? (
          <CorrectionForm
            invoice={data}
            onCancel={() => setCorrecting(false)}
            onSaved={() => {
              setCorrecting(false);
              setMessage('Datos del cliente corregidos; el número no cambia.');
              reload();
            }}
          />
        ) : (
          <button type="button" className="link-button" onClick={() => setCorrecting(true)}>
            Corregir datos del cliente
          </button>
        ))}
      {data.status === 'PENDING_CHECK' && (
        <div className="form-actions">
          <button
            type="button"
            className="button button-primary"
            disabled={busy}
            onClick={reconcile}
          >
            {busy ? 'Conciliando…' : 'Conciliar envío con SUNAT'}
          </button>
        </div>
      )}
      {data.voids && data.voids.length > 0 && <VoidHistory voids={data.voids} />}
      {data.status === 'VOIDING' && (
        <div className="form-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => runAction(() => api.checkInvoiceVoid(id), 'Anulación consultada')}
          >
            Consultar anulación en SUNAT
          </button>
        </div>
      )}
      {data.status === 'ACCEPTED' && (
        <section className="bo-invoice-corrections" aria-label="Anulación del comprobante">
          <h3 className="flow-subtitle">Anulación del comprobante</h3>
          <p className="muted">
            Utiliza esta acción si corresponde solicitar la anulación de este documento. No cancela
            por sí misma el pedido ni devuelve el pago.
          </p>
          <VoidForm
            series={data.serialNumber}
            onVoid={(reason) => runAction(() => api.voidInvoice(id, reason), 'Anulación procesada')}
            busy={busy}
          />
        </section>
      )}
      {data.attempts && data.attempts.length > 0 && <AttemptHistory attempts={data.attempts} />}
      {canSubmit && !correcting && (
        <div className="form-stack">
          <p className="muted">
            {data.test
              ? 'El comprobante corresponde al entorno de pruebas, sin valor tributario. Revisa la respuesta después del envío.'
              : 'El servicio de facturación procesa el envío. Revisa su respuesta para confirmar la aceptación.'}
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="button button-primary"
              disabled={busy}
              onClick={submit}
            >
              {busy
                ? 'Enviando…'
                : data.status === 'FAILED'
                  ? 'Reintentar envío'
                  : 'Enviar comprobante'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
