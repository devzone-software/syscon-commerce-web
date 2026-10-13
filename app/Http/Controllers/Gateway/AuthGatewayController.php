<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthGatewayController extends GatewayController
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:12|max:128|confirmed',
            'firstName' => 'required|string|max:80',
            'lastName' => 'required|string|max:80',
            'documentType' => 'required|in:DNI,CE,RUC,PASAPORTE',
            'documentNumber' => 'required|string|max:15',
            'phone' => ['required', 'regex:/^9\d{8}$/'],
        ]);
        unset($data['password_confirmation']);
        return $this->reply($this->api->request('POST', '/api/auth/register', $data));
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        if ($error = $this->requireIdentityConfig()) return $error;
        return $this->startSession($request, $this->api->request('POST', '/api/auth/login', $data), $data['email']);
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
        ]]);
    }
}
