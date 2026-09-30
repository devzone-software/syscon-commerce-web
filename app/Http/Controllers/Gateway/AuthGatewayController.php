<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthGatewayController extends GatewayController
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email|max:255', 'password' => 'required|string|min:12|max:128']);
        return $this->reply($this->api->request('POST', '/api/auth/register', $data));
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        if ($error = $this->requireIdentityConfig()) return $error;
        $result = $this->api->request('POST', '/api/auth/login', $data);
        if ($result['status'] === 200 && isset($result['body']['data']['accessToken'], $result['body']['data']['refreshToken'])) {
            // Keep the session only if /me will be able to read this token afterwards.
            if (! $this->identity->claims($result['body']['data']['accessToken'])) {
                Log::error('El Auth Service emitió un token que la web no puede verificar: revisa que JWT_SECRET coincida y que el emisor sea syscon-auth.');
                return response()->json(['success' => false, 'message' => 'No se pudo validar la sesión emitida por el servicio de autenticación. Contacta al administrador.'], 502);
            }
            $request->session()->regenerate();
            session(['syscon.access' => $result['body']['data']['accessToken'], 'syscon.refresh' => $result['body']['data']['refreshToken'], 'syscon.email' => $data['email']]);
            return response()->json(['success' => true, 'message' => 'Autenticado.', 'data' => null])->header('X-CSRF-TOKEN', csrf_token());
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
            'email' => session('syscon.email'),
            'roles' => array_values(array_filter($authorities, fn ($a) => str_starts_with($a, 'ROLE_'))),
            'permissions' => array_values(array_filter($authorities, fn ($a) => ! str_starts_with($a, 'ROLE_'))),
        ]]);
    }
}
