import { useState, type ReactNode } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon } from '../icons';

/** Text input with a leading icon and an optional trailing control (Figma inputs). */
export function InputBox({
  icon,
  label,
  required,
  trailing,
  children,
}: {
  icon?: ReactNode;
  label: string;
  required?: boolean;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="auth-field">
      <span className="auth-label">
        {label} {required && <em aria-hidden="true">*</em>}
      </span>
      <span className="auth-input">
        {icon}
        {children}
        {trailing}
      </span>
    </label>
  );
}

export function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <InputBox
      icon={<LockIcon size={16} />}
      label={label}
      required
      trailing={
        <button
          type="button"
          className="auth-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      }
    >
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={minLength}
        maxLength={128}
        title={minLength ? `Usa al menos ${minLength} caracteres.` : undefined}
        autoComplete={autoComplete}
        placeholder="••••••••••••"
      />
    </InputBox>
  );
}
