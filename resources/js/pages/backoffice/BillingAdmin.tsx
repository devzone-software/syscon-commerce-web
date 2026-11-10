import { BillingOrderPicker } from '../../components/backoffice/BillingOrderPicker';
import { can, permissions } from '../../lib/auth';
import { useShop } from '../../state';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IdLookup } from '../../components/backoffice/IdLookup';
import { PageHeader } from '../../components/backoffice/PageHeader';
import { InvoiceForm } from '../../components/backoffice/InvoiceForm';
import { InvoiceDetail } from '../../components/backoffice/InvoiceDetail';
import { InvoiceSeriesPanel } from '../../components/backoffice/InvoiceSeriesPanel';
import { InvoiceWorkflowNotice } from '../../components/backoffice/InvoiceWorkflowNotice';
import { invoiceStatusLabels } from '../../lib/billing';
import { api } from '../../services/api';
import { type Invoice } from '../../types';
import { useData, ErrorBox, Loading } from '../../ui';

export function BillingAdmin() {
  const { user } = useShop();
  const managesOrders = can(user, permissions.ordersManage);
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? '';
  const orderId = params.get('pedido') ?? '';
  const [notice, setNotice] = useState('');
  const series = useData(api.invoiceSeries);
  const created = (invoice: Invoice) => {
    setNotice(
      `Comprobante ${invoice.serialNumber}: ${invoiceStatusLabels[invoice.status] ?? invoice.status}.`,
    );
    setParams({ id: invoice.id });
    series.reload();
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="billing-workspace">
      <PageHeader
        title="Comprobantes"
        description="Prepara borradores desde pedidos pagados y consulta el resultado de su emisión."
        actions={
          id || orderId ? (
            <Link className="button button-secondary" to="/admin/facturacion">
              Volver a comprobantes
            </Link>
          ) : (
            managesOrders && (
              <Link className="button button-secondary" to="/admin/pedidos">
                Ver pedidos
              </Link>
            )
          )
        }
      />
      <InvoiceWorkflowNotice />
      {!id && !orderId && managesOrders && <BillingOrderPicker />}
      <details className="bo-card bo-disclosure" open={Boolean(id)}>
        <summary>Buscar un comprobante por su identificador</summary>
        <IdLookup
          label="ID del comprobante"
          value={id}
          onSearch={(value) => {
            setNotice('');
            setParams({ id: value });
          }}
        />
      </details>
      {id && <InvoiceDetail key={id + notice} id={id} notice={notice} />}
      {series.loading && !series.data ? (
        <Loading />
      ) : series.error && !series.data ? (
        <ErrorBox message={series.error} retry={series.reload} />
      ) : (
        <>
          {orderId ? (
            <InvoiceForm
              key={orderId}
              orderId={orderId}
              series={series.data ?? []}
              onCreated={created}
            />
          ) : (
            <details className="bo-disclosure">
              <summary>Preparación manual por ID de pedido</summary>
              <InvoiceForm orderId="" series={series.data ?? []} onCreated={created} />
            </details>
          )}
          <details className="bo-disclosure">
            <summary>Configuración de emisión: series y numeración</summary>
            <p className="muted">
              Para preparar un comprobante puedes usar las series ya registradas. Abre esta sección
              cuando necesites configurar una serie o revisar su numeración con el responsable de
              facturación.
            </p>
            <InvoiceSeriesPanel series={series.data ?? []} onChanged={series.reload} />
          </details>
        </>
      )}
    </div>
  );
}
