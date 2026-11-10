import { useRef, useState } from 'react';
import { isHttpUrl } from '../../lib/validation';

/** Uses the existing image URL field; no uploads or product mutations until the form is saved. */
export function ProductImageEditor({
  value,
  original,
  name,
  error,
  disabled,
  onChange,
}: {
  value: string;
  original: string;
  name: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(() => (isHttpUrl(value.trim()) ? value.trim() : ''));
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const inspect = () => {
    if (!isHttpUrl(value.trim())) {
      setPreviewError('Pega un enlace directo de imagen que empiece por https:// o http://.');
      input.current?.focus();
      return;
    }
    setPreviewError('');
    setFailed(false);
    setLoaded(false);
    setPreview(value.trim());
    setAttempt((current) => current + 1);
  };
  const resetPreview = (url: string) => {
    onChange(url);
    setPreview(isHttpUrl(url.trim()) ? url.trim() : '');
    setFailed(false);
    setLoaded(false);
    setPreviewError('');
    setAttempt((current) => current + 1);
  };
  const outdated = preview !== value.trim();
  return (
    <fieldset className="product-image-editor" disabled={disabled}>
      <legend>Imagen del producto</legend>
      <div className="product-image-editor-layout">
        <div className="product-image-editor-preview">
          {preview && !failed ? (
            <img
              key={`${preview}-${attempt}`}
              src={preview}
              alt={`Vista previa de ${name || 'producto'}`}
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
              onError={() => {
                setFailed(true);
                setLoaded(false);
              }}
            />
          ) : (
            <span>{failed ? 'No se pudo cargar la imagen' : 'Sin imagen seleccionada'}</span>
          )}
        </div>
        <div className="field">
          <label htmlFor="product-image">Enlace de la imagen</label>
          <input
            ref={input}
            id="product-image"
            type="url"
            value={value}
            placeholder="https://sitio.com/foto-del-producto.jpg"
            onChange={(e) => {
              onChange(e.target.value);
              setPreviewError('');
            }}
            aria-invalid={Boolean(error || previewError)}
            aria-describedby="product-image-help product-image-status"
          />
          <small id="product-image-help">
            Pega el enlace directo de la foto del modelo exacto.
          </small>
          <div className="product-image-editor-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={inspect}
              disabled={!value.trim()}
            >
              Ver imagen
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                resetPreview('');
                input.current?.focus();
              }}
              disabled={!value.trim() && !preview}
            >
              Quitar imagen
            </button>
            {value !== original && (
              <button type="button" className="link-button" onClick={() => resetPreview(original)}>
                Deshacer cambio
              </button>
            )}
          </div>
          <p
            id="product-image-status"
            className={error || previewError || (failed && !outdated) ? 'field-error' : 'flow-note'}
            role="status"
          >
            {error ||
              previewError ||
              (outdated
                ? 'Pulsa «Ver imagen» para revisar el nuevo enlace.'
                : failed
                  ? 'Revisa que el enlace sea público y apunte directamente a una imagen.'
                  : preview && !loaded
                    ? 'Cargando vista previa…'
                    : value !== original
                      ? 'Cambio pendiente. Pulsa «Guardar producto» para aplicarlo.'
                      : 'Los cambios se aplican al guardar el producto.')}
          </p>
        </div>
      </div>
    </fieldset>
  );
}
