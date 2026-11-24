import { useEffect, useRef, useState } from 'react';

type GoogleId = {
  initialize: (options: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    ux_mode?: 'popup';
    context?: 'signin' | 'signup';
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
let loading: Promise<void> | null = null;

function loadGoogle() {
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('No se pudo cargar Google.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Public OAuth client id rendered by Laravel; empty when sign-in with Google is not configured. */
export const googleClientId = () =>
  document.querySelector<HTMLMetaElement>('meta[name="google-client-id"]')?.content.trim() ?? '';

/** Official Google Identity Services button; hands the ID token to `onCredential`. */
export function GoogleButton({
  mode,
  onCredential,
}: {
  mode: 'signin' | 'signup';
  onCredential: (credential: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  callback.current = onCredential;
  const [failed, setFailed] = useState(false);
  const clientId = googleClientId();

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    loadGoogle()
      .then(() => {
        const google = window.google?.accounts.id;
        if (!active || !google || !container.current) return;
        google.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          context: mode,
          callback: (response) => response.credential && callback.current(response.credential),
        });
        google.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          logo_alignment: 'left',
          locale: 'es',
          width: Math.min(container.current.clientWidth || 400, 400),
        });
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [clientId, mode]);

  if (!clientId) return null;
  return failed ? (
    <p className="signin-google-error">
      No se pudo cargar el ingreso con Google. Usa tu correo o vuelve a intentarlo.
    </p>
  ) : (
    <div className="signin-google" ref={container} />
  );
}
