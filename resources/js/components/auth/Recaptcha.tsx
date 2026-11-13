import { useEffect, useRef, useState } from 'react';

type Grecaptcha = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => number;
  reset: (widget?: number) => void;
};
declare global {
  interface Window {
    grecaptcha?: Grecaptcha & { ready: (callback: () => void) => void };
    onSysconRecaptcha?: () => void;
  }
}

let loading: Promise<void> | null = null;
function loadRecaptcha() {
  loading ??= new Promise<void>((resolve, reject) => {
    window.onSysconRecaptcha = () => resolve();
    const script = document.createElement('script');
    script.src =
      'https://www.google.com/recaptcha/api.js?onload=onSysconRecaptcha&render=explicit&hl=es';
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error('No se pudo cargar reCAPTCHA.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Public reCAPTCHA v2 site key rendered by Laravel; empty when the check is off. */
export const recaptchaSiteKey = () =>
  document.querySelector<HTMLMetaElement>('meta[name="recaptcha-site-key"]')?.content.trim() ?? '';

/**
 * "No soy un robot" checkbox. Hands the token to `onToken` (empty string when it expires);
 * changing `resetKey` clears the box so it must be checked again.
 */
export function Recaptcha({
  onToken,
  resetKey,
}: {
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [failed, setFailed] = useState(false);
  const siteKey = recaptchaSiteKey();

  useEffect(() => {
    if (!siteKey) return;
    let active = true;
    loadRecaptcha()
      .then(() => {
        if (!active || !container.current || !window.grecaptcha || widget.current !== null) return;
        widget.current = window.grecaptcha.render(container.current, {
          sitekey: siteKey,
          callback: (token) => callback.current(token),
          'expired-callback': () => callback.current(''),
          'error-callback': () => callback.current(''),
        });
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey && widget.current !== null) {
      window.grecaptcha?.reset(widget.current);
      callback.current('');
    }
  }, [resetKey]);

  if (!siteKey) return null;
  return failed ? (
    <p className="signin-google-error">
      No se pudo cargar la verificación "No soy un robot". Recarga la página.
    </p>
  ) : (
    <div className="login-recaptcha" ref={container} />
  );
}
