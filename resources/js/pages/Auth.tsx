import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginFlow } from '../components/auth/LoginFlow';
import { SignUpFlow } from '../components/auth/SignUpFlow';
import { loginDestination } from '../lib/auth';
import { api, ApiError } from '../services/api';
import { useShop } from '../state';
import type { SignUp } from '../types';

/** Sign-in (`/ingresar`) and sign-up (`/registro`): shared session handling for both flows. */
export function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { reloadUser } = useShop();
  // Page requested before RequireAuth sent the visitor here, e.g. the checkout.
  const requestedFrom = (location.state as { from?: unknown } | null)?.from;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const [takenEmail, setTakenEmail] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  // Confirm the new session before leaving: reloadUser() alone swallows errors, which
  // would send the visitor straight back to this form without explanation.
  const finish = async (isNew: boolean) => {
    const signedInUser = await api.me();
    await reloadUser();
    if (isNew) setCreated(true);
    else navigate(loginDestination(signedInUser, requestedFrom), { replace: true });
  };
  const run = async (action: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const signIn = (login: string, password: string) =>
    void run(async () => {
      try {
        await api.login(login, password);
      } catch (e) {
        // 428: the "No soy un robot" check expired or ran out of tries; LoginFlow goes back to it.
        if (e instanceof ApiError && e.status === 428) setCaptchaReset((n) => n + 1);
        throw e;
      }
      await finish(false);
    });
  const withGoogle = (credential: string) =>
    void run(async () => {
      const { created: isNew } = await api.googleLogin(credential);
      await finish(Boolean(isNew));
    });
  const signUp = (profile: SignUp) =>
    void run(async () => {
      setTakenEmail(null);
      try {
        await api.register(profile);
      } catch (e) {
        // 409: an account already uses this e-mail; the form explains it next to the field.
        if (e instanceof ApiError && e.status === 409) return setTakenEmail(profile.email);
        throw e;
      }
      await api.login(profile.email, profile.password);
      await finish(true);
    });
  // A new account always lands on the home page after the confirmation.
  const onContinue = () => navigate('/', { replace: true });

  return register ? (
    <SignUpFlow
      busy={busy}
      error={error}
      takenEmail={takenEmail}
      created={created}
      onSubmit={signUp}
      onGoogle={withGoogle}
      onContinue={onContinue}
    />
  ) : (
    <LoginFlow
      busy={busy}
      error={error}
      created={created}
      captchaReset={captchaReset}
      onSubmit={signIn}
      onGoogle={withGoogle}
      onContinue={onContinue}
    />
  );
}
