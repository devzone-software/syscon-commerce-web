import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  countdown,
  idleLimitMs,
  idlePhase,
  readActivity,
  writeActivity,
  type IdlePhase,
} from '../lib/idle';
import { api, SESSION_EXPIRED } from '../services/api';
import { useShop } from '../state';

const EXPIRED_KEY = 'syscon.expired';
const markExpired = () => {
  try {
    sessionStorage.setItem(EXPIRED_KEY, '1');
  } catch {
    // The sign-in page also gets the reason through the navigation state.
  }
};
/** True once after an inactivity sign-out, so the sign-in page can say why. */
export function takeExpiredNotice() {
  try {
    const value = sessionStorage.getItem(EXPIRED_KEY) === '1';
    sessionStorage.removeItem(EXPIRED_KEY);
    return value;
  } catch {
    return false;
  }
}

const ACTIVITY_EVENTS = [
  'pointerdown',
  'pointermove',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
] as const;
/** The server learns about activity at most this often while nothing else is sent. */
const PING_EVERY_MS = 60_000;

/**
 * Signs a visitor out after the idle limit even if the page stays open: warns one minute before,
 * then closes the session and goes to the sign-in page, which returns here after signing in.
 */
export function IdleSession() {
  const { user, logout, reloadUser } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<IdlePhase>({ phase: 'active', remainingMs: 0 });
  const stay = useRef<HTMLButtonElement>(null);
  const lastPing = useRef(0);
  const closing = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;
  const here = location.pathname + location.search;
  const hereRef = useRef(here);
  hereRef.current = here;

  const toSignIn = () =>
    navigate('/ingresar', { replace: true, state: { from: hereRef.current, expired: true } });

  // The server may close the session first (another device clock, a sleeping laptop…).
  useEffect(() => {
    const expired = () => {
      markExpired();
      // Only a page that was showing the account moves to the sign-in page; a public page
      // opened later simply continues as a guest.
      if (closing.current || !userRef.current) return;
      closing.current = true;
      void reloadUser().finally(() => {
        closing.current = false;
        toSignIn();
      });
    };
    window.addEventListener(SESSION_EXPIRED, expired);
    return () => window.removeEventListener(SESSION_EXPIRED, expired);
  }, []);

  useEffect(() => {
    if (!user) return;
    const limit = idleLimitMs();
    writeActivity(Date.now());
    let warning = false;

    const active = () => {
      if (warning) return; // During the warning only the buttons keep the session.
      const now = Date.now();
      writeActivity(now);
      if (now - lastPing.current > PING_EVERY_MS) {
        lastPing.current = now;
        void api.pingSession().catch(() => undefined);
      }
    };
    const tick = () => {
      const next = idlePhase(readActivity(Date.now()), Date.now(), limit);
      warning = next.phase === 'warning';
      setState(next);
      if (next.phase === 'expired' && !closing.current) {
        closing.current = true;
        markExpired();
        void logout()
          .catch(() => undefined)
          .finally(() => {
            closing.current = false;
            toSignIn();
          });
      }
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, active, { passive: true }));
    document.addEventListener('visibilitychange', tick);
    const timer = window.setInterval(tick, 1000);
    tick();
    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, active));
      document.removeEventListener('visibilitychange', tick);
      window.clearInterval(timer);
    };
  }, [user?.id]);

  const showing = Boolean(user) && state.phase === 'warning';
  useEffect(() => {
    if (showing) stay.current?.focus();
  }, [showing]);

  if (!showing) return null;
  const keep = () => {
    writeActivity(Date.now());
    lastPing.current = Date.now();
    void api.pingSession().catch(() => undefined);
    setState({ phase: 'active', remainingMs: 0 });
  };
  const leave = () => {
    closing.current = true;
    void logout()
      .catch(() => undefined)
      .finally(() => {
        closing.current = false;
        navigate('/', { replace: true });
      });
  };
  return (
    <div className="idle-overlay">
      <div
        className="idle-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-title"
        aria-describedby="idle-text"
      >
        <span className="idle-clock" aria-hidden="true">
          {countdown(state.remainingMs)}
        </span>
        <h2 id="idle-title">¿Sigues ahí?</h2>
        <p id="idle-text">
          Por seguridad, tu sesión se cerrará en <strong>{countdown(state.remainingMs)}</strong> por
          inactividad.
        </p>
        <div className="idle-actions">
          <button ref={stay} type="button" className="button button-primary" onClick={keep}>
            Seguir conectado
          </button>
          <button type="button" className="button button-secondary" onClick={leave}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
