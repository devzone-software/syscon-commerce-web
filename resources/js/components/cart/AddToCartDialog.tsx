import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cartAvailability, cartTotal, cartUnits } from '../../lib/cart';
import { money, useShop } from '../../state';
import type { Product } from '../../types';
import { ProductImage } from '../ProductImage';
import { QuantityStepper } from '../shared/QuantityStepper';
import { CartIcon, CheckIcon, CloseIcon, ShieldIcon, TruckIcon } from '../icons';

type Request = { product: Product; quantity: number };
type ConfirmAdd = (product: Product, quantity?: number) => void;

const Context = createContext<ConfirmAdd | null>(null);

/** Opens the confirmation window before a product is added to the order. */
export function useConfirmAdd() {
  const value = useContext(Context);
  if (!value) throw new Error('AddToCartProvider missing');
  return value;
}

/**
 * Every "Agregar" button goes through this window: it shows the product details, lets the
 * customer adjust the quantity within the available stock and confirms before touching the cart.
 */
export function AddToCartProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const confirmAdd: ConfirmAdd = (product, quantity = 1) =>
    setRequest({ product, quantity: Math.max(1, Math.floor(quantity)) });
  return (
    <Context.Provider value={confirmAdd}>
      {children}
      {request && (
        <AddToCartDialog
          key={request.product.id}
          request={request}
          onClose={() => setRequest(null)}
        />
      )}
    </Context.Provider>
  );
}

function AddToCartDialog({ request, onClose }: { request: Request; onClose: () => void }) {
  const { cart, add } = useShop();
  const dialog = useRef<HTMLDialogElement>(null);
  const { product } = request;
  const { inCart, remaining } = cartAvailability(cart, product);
  const [quantity, setQuantity] = useState(Math.min(request.quantity, Math.max(remaining, 1)));
  const [added, setAdded] = useState(0);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => element?.close();
  }, []);

  const confirm = () => {
    add(product, quantity);
    setAdded(quantity);
  };
  const price = Number(product.price);
  const details = [product.category, product.brand].filter(Boolean).join(' · ');

  return (
    <dialog
      ref={dialog}
      className="add-dialog"
      aria-labelledby="add-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the backdrop (the dialog element itself) closes the window.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="add-dialog-card">
        <header className="add-dialog-head">
          <h2 id="add-dialog-title">
            {added ? (
              <>
                <CheckIcon size={18} /> Producto agregado a tu pedido
              </>
            ) : (
              'Confirmar producto en tu pedido'
            )}
          </h2>
          <button type="button" className="add-dialog-close" onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </header>

        <div className="add-dialog-product">
          <span className="add-dialog-media">
            <ProductImage product={product} />
          </span>
          <div>
            {details && <p className="add-dialog-cat">{details}</p>}
            <h3>{product.name}</h3>
            <code>SKU: {product.sku}</code>
            {inCart > 0 && (
              <p className="add-dialog-stock">
                <i aria-hidden="true" />
                {inCart} {inCart === 1 ? 'unidad' : 'unidades'} ya en tu carrito
              </p>
            )}
          </div>
        </div>

        {added ? (
          <dl className="add-dialog-summary">
            <div>
              <dt>Agregaste</dt>
              <dd>
                {added} {added === 1 ? 'unidad' : 'unidades'} · {money(price * added)}
              </dd>
            </div>
            <div>
              <dt>Tu carrito</dt>
              <dd>
                {cartUnits(cart)} {cartUnits(cart) === 1 ? 'unidad' : 'unidades'}
              </dd>
            </div>
            <div className="is-total">
              <dt>Total estimado</dt>
              <dd>{money(cartTotal(cart))}</dd>
            </div>
          </dl>
        ) : remaining > 0 ? (
          <dl className="add-dialog-summary">
            <div>
              <dt>Precio unitario</dt>
              <dd>{money(price)}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>
                <QuantityStepper
                  label="Cantidad a agregar"
                  value={quantity}
                  max={remaining}
                  onChange={(value) => setQuantity(Math.min(Math.max(1, value), remaining))}
                />
              </dd>
            </div>
            <div className="is-total">
              <dt>Subtotal</dt>
              <dd>{money(price * quantity)}</dd>
            </div>
          </dl>
        ) : (
          <p className="notice" role="status">
            {product.stock < 1
              ? 'Este producto está agotado por ahora.'
              : 'Alcanzaste la cantidad máxima disponible para este producto.'}
          </p>
        )}

        <ul className="add-dialog-notes">
          <li>
            <ShieldIcon size={14} /> Producto original con garantía del fabricante
          </li>
          <li>
            <TruckIcon size={14} /> Retiro en tienda o envío a domicilio · el precio y la
            disponibilidad se confirman al crear el pedido
          </li>
        </ul>

        <footer className="add-dialog-actions">
          {added ? (
            <>
              <button type="button" className="is-soft" onClick={onClose}>
                Seguir comprando
              </button>
              <Link to="/carrito" className="is-soft" onClick={onClose}>
                Ver carrito
              </Link>
              <Link to="/checkout" className="is-primary" onClick={onClose}>
                Ir a pagar
              </Link>
            </>
          ) : (
            <>
              <button type="button" className="is-soft" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={confirm}
                disabled={remaining < 1}
                autoFocus
              >
                <CartIcon size={16} /> Confirmar y agregar
              </button>
            </>
          )}
        </footer>
      </div>
    </dialog>
  );
}
