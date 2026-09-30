import { useEffect, useState, type FormEvent } from 'react';
import { isUuid } from '../../lib/validation';

/** Finds a record by its UUID; the backend has no listing endpoint for these records. */
export function IdLookup({
  label,
  value,
  onSearch,
}: {
  label: string;
  value: string;
  onSearch: (id: string) => void;
}) {
  const [input, setInput] = useState(value);
  const [error, setError] = useState('');
  useEffect(() => setInput(value), [value]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const id = input.trim();
    if (!isUuid(id)) {
      setError('Ingresa un identificador válido (UUID de 36 caracteres).');
      return;
    }
    setError('');
    onSearch(id.toLowerCase());
  };
  return (
    <form className="bo-lookup" onSubmit={submit} noValidate>
      <label className="field">
        {label}
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="00000000-0000-0000-0000-000000000000"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'lookup-error' : undefined}
          spellCheck={false}
          autoComplete="off"
        />
      </label>
      <button type="submit" className="button button-primary">
        Buscar
      </button>
      {error && (
        <p id="lookup-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
