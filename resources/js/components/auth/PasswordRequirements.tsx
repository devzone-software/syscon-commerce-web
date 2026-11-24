import { CheckIcon } from '../icons';
import { MIN_PASSWORD, passwordRequirementStatus } from '../../lib/auth';

/** Shows the actual password requirement without presenting optional character classes as rules. */
export function PasswordRequirements({ value, matches }: { value: string; matches?: boolean }) {
  const { remaining, complete } = passwordRequirementStatus(value);

  return (
    <div className="auth-strength" aria-live="polite">
      <div className="auth-strength-head">
        <span>REQUISITO DE CONTRASEÑA</span>
        {value && (
          <b className={complete ? 'is-valid' : undefined}>
            {complete
              ? 'Mínimo cumplido'
              : `Falta${remaining === 1 ? '' : 'n'} ${remaining} ${remaining === 1 ? 'carácter' : 'caracteres'}`}
          </b>
        )}
        {matches && (
          <span className="auth-match">
            <CheckIcon size={14} /> Las contraseñas coinciden
          </span>
        )}
      </div>
      <ul className="auth-password-checklist">
        <li className={complete ? 'is-ok' : undefined}>
          {complete && <CheckIcon size={12} />}
          Mínimo {MIN_PASSWORD} caracteres
        </li>
      </ul>
      <p className="auth-password-guidance">
        Puedes usar una frase larga; no es obligatorio combinar mayúsculas, números ni símbolos.
      </p>
    </div>
  );
}
