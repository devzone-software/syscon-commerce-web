import { useState } from 'react';
import { api } from '../../services/api';
import type { CustomerMatch } from '../../types';

/** Registered customer search; without one the sale goes to the counter account. */
export function CustomerPicker({
  customer,
  onPick,
}: {
  customer: CustomerMatch | null;
  onPick: (customer: CustomerMatch | null) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CustomerMatch[] | null>(null);
  const [error, setError] = useState('');
  const search = async () => {
    setError('');
    if (q.trim().length < 2) return setError('Escribe al menos 2 caracteres.');
    try {
      setResults(await api.searchCustomers(q.trim()));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (customer)
    return (
      <p className="notice">
        Cliente: <strong>{customer.name ?? customer.email}</strong> · {customer.email}
        {customer.documentNumber && ` · ${customer.documentNumber}`}.{' '}
        <button type="button" className="link-button" onClick={() => onPick(null)}>
          Cambiar a cliente de mostrador
        </button>
      </p>
    );
  return (
    <div className="form-stack">
      <p className="muted">
        Sin cliente registrado la venta queda en la cuenta de mostrador (no recibe correos). Busca
        un cliente para asociarle la compra y enviarle su comprobante.
      </p>
      <div className="bo-lookup">
        <label className="field">
          Buscar cliente registrado
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Correo, nombre o DNI/RUC"
          />
        </label>
        <button type="button" className="button button-secondary" onClick={search}>
          Buscar
        </button>
      </div>
      {error && <small className="field-error">{error}</small>}
      {results &&
        (results.length ? (
          <ul className="bo-simple-list">
            {results.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.name ?? item.email}</strong>
                  <small>
                    {item.email}
                    {item.documentNumber && ` · ${item.documentType} ${item.documentNumber}`}
                  </small>
                </span>
                <button type="button" className="link-button" onClick={() => onPick(item)}>
                  Elegir
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Sin coincidencias.</p>
        ))}
    </div>
  );
}
