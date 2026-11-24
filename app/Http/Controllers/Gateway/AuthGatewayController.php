<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AuthGatewayController extends GatewayController
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:12|max:128',
            'firstName' => 'required|string|max:80',
            'lastName' => 'required|string|max:80',
            'phone' => ['required', 'regex:/^9\d{8}$/'],
            'contactConsent' => 'boolean',
            // The form says "Al continuar, acepto los Términos…", so the request must carry that acceptance.
            'termsAccepted' => 'accepted',
        ]);
        // The document is asked at checkout, where it is needed for the receipt.
        $data['contactConsent'] = (bool) ($data['contactConsent'] ?? false);
        $data['termsAccepted'] = true;
        return $this->reply($this->api->request('POST', '/api/auth/register', $data));
    }

    public function login(Request $request): JsonResponse
    {
        // "login" is the e-mail or the mobile number; "email" stays accepted for older clients.
        $data = $request->validate([
            'login' => 'required_without:email|nullable|string|max:255',
            'email' => 'required_without:login|nullable|string|max:255',
            'password' => 'required|string',
        ]);
        if ($error = $this->requireIdentityConfig()) return $error;
        if ($error = $this->requireCaptcha()) return $error;
        $login = trim($data['login'] ?? $data['email']);
        $result = $this->api->request('POST', '/api/auth/login', ['login' => $login, 'password' => $data['password']]);
        if ($result['status'] === 200) session()->forget(self::CAPTCHA);
        // The session e-mail comes from the token; the typed value only helps when it is an e-mail.
        return $this->startSession($request, $result, str_contains($login, '@') ? $login : null);
    }

    private const CAPTCHA = 'syscon.captcha';
    private const CAPTCHA_MINUTES = 10;
    private const CAPTCHA_TRIES = 5;

    /** reCAPTCHA v2 token from the sign-in form: once Google accepts it, a few password tries are allowed. */
    public function captcha(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => 'required|string|max:4096']);
        $secret = (string) config('services.recaptcha.secret');
        if ($secret === '') return response()->json(['success' => true, 'message' => 'Verificación no requerida.', 'data' => null]);
        try {
            $answer = Http::asForm()->timeout(10)->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secret, 'response' => $data['token'], 'remoteip' => $request->ip(),
            ])->json();
        } catch (ConnectionException) {
            return response()->json(['success' => false, 'message' => 'No se pudo verificar que no eres un robot. Inténtalo de nuevo.', 'data' => null], 503);
        }
        if (! ($answer['success'] ?? false)) {
            return response()->json(['success' => false, 'message' => 'No se pudo confirmar que no eres un robot. Vuelve a marcar la casilla.', 'data' => null], 422);
        }
        session([self::CAPTCHA => ['until' => now()->addMinutes(self::CAPTCHA_MINUTES)->timestamp, 'tries' => 0]]);
        return response()->json(['success' => true, 'message' => 'Verificado.', 'data' => null]);
    }

    /** With reCAPTCHA configured, each password try spends one of the tries the last check granted. */
    private function requireCaptcha(): ?JsonResponse
    {
        if ((string) config('services.recaptcha.secret') === '') return null;
        $pass = session(self::CAPTCHA);
        if (! is_array($pass) || ($pass['until'] ?? 0) < now()->timestamp || ($pass['tries'] ?? 0) >= self::CAPTCHA_TRIES) {
            session()->forget(self::CAPTCHA);
            return response()->json(['success' => false, 'message' => 'Confirma que no eres un robot para continuar.', 'data' => null], 428);
        }
        session([self::CAPTCHA => ['until' => $pass['until'], 'tries' => $pass['tries'] + 1]]);
        return null;
    }

    /** Google Identity Services credential (ID token); auth-service verifies it and creates the customer if needed. */
    public function google(Request $request): JsonResponse
    {
        $data = $request->validate(['credential' => 'required|string|max:4096']);
        if ($error = $this->requireIdentityConfig()) return $error;
        $result = $this->api->request('POST', '/api/auth/google', $data);
        return $this->startSession($request, $result, null, ['created' => (bool) ($result['body']['data']['created'] ?? false)]);
    }

    private function startSession(Request $request, array $result, ?string $email, ?array $reply = null): JsonResponse
    {
        if ($result['status'] === 200 && isset($result['body']['data']['accessToken'], $result['body']['data']['refreshToken'])) {
            // Keep the session only if /me will be able to read this token afterwards.
            $claims = $this->identity->claims($result['body']['data']['accessToken']);
            if (! $claims) {
                Log::error('El Auth Service emitió un token que la web no puede verificar: revisa que JWT_SECRET coincida y que el emisor sea syscon-auth.');
                return response()->json(['success' => false, 'message' => 'No se pudo validar la sesión emitida por el servicio de autenticación. Contacta al administrador.'], 502);
            }
            $request->session()->regenerate();
            session(['syscon.access' => $result['body']['data']['accessToken'], 'syscon.refresh' => $result['body']['data']['refreshToken'], 'syscon.email' => $claims['email'] ?? $email]);
            return response()->json(['success' => true, 'message' => 'Autenticado.', 'data' => $reply])->header('X-CSRF-TOKEN', csrf_token());
        }
        return $this->reply($result);
    }

    /** Activity from an open page that sends nothing else; the idle middleware records it. */
    public function ping(): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        return response()->json(['success' => true, 'message' => 'Sesión activa.', 'data' => null]);
    }

    public function logout(Request $request): JsonResponse
    {
        $refresh = session('syscon.refresh');
        if ($refresh) $this->api->request('POST', '/api/auth/logout', ['refreshToken' => $refresh]);
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['success' => true, 'message' => 'Sesión cerrada.'])->header('X-CSRF-TOKEN', csrf_token());
    }

    /** Stored profile (document, phone) used to prefill the checkout billing form. */
    public function profile(): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        return $this->reply($this->api->authenticated('GET', '/api/auth/profile'));
    }

    public function me(): JsonResponse
    {
        if ($error = $this->requireIdentityConfig()) return $error;
        if ($error = $this->requireLogin()) return $error;
        $result = $this->api->authenticated('GET', '/api/auth/me');
        if ($result['status'] !== 200) return $this->reply($result);
        $claims = $this->identity->claims(session('syscon.access'));
        if (! $claims) return response()->json(['success' => false, 'message' => 'Sesión inválida.'], 401);
        $authorities = $claims['authorities'] ?? [];
        return response()->json(['success' => true, 'data' => [
            'id' => $claims['sub'],
            'email' => $claims['email'] ?? session('syscon.email'),
            'firstName' => $claims['given_name'] ?? null,
            'lastName' => $claims['family_name'] ?? null,
            'roles' => array_values(array_filter($authorities, fn ($a) => str_starts_with($a, 'ROLE_'))),
            'permissions' => array_values(array_filter($authorities, fn ($a) => ! str_starts_with($a, 'ROLE_'))),
            // Temporary password handed out by the superadmin: the store asks for a new one before anything else.
            'mustChangePassword' => (bool) ($claims['pwd_change'] ?? false),
        ]]);
    }

    /** Own password change; the platform closes every other session and returns a fresh token pair. */
    public function password(Request $request): JsonResponse
    {
        if ($error = $this->requireIdentityConfig()) return $error;
        if ($error = $this->requireLogin()) return $error;
        $data = $request->validate([
            'currentPassword' => 'required|string',
            'newPassword' => 'required|string|min:12|max:128|confirmed|different:currentPassword',
        ]);
        $result = $this->api->authenticated('POST', '/api/auth/password', ['currentPassword' => $data['currentPassword'], 'newPassword' => $data['newPassword']]);
        if ($result['status'] !== 200 || ! isset($result['body']['data']['accessToken'], $result['body']['data']['refreshToken'])) return $this->reply($result);
        session(['syscon.access' => $result['body']['data']['accessToken'], 'syscon.refresh' => $result['body']['data']['refreshToken']]);
        return response()->json(['success' => true, 'message' => 'Contraseña actualizada.', 'data' => null]);
    }
}
