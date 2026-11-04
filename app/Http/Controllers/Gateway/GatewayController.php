<?php

namespace App\Http\Controllers\Gateway;

use App\Http\Controllers\Controller;
use App\Services\Identity;
use App\Services\JavaApi;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

/**
 * Base for the /web-api controllers: forwards to the Java services and applies the
 * same permission names that the services check with @PreAuthorize.
 */
abstract class GatewayController extends Controller
{
    public function __construct(protected JavaApi $api, protected Identity $identity) {}

    protected function reply(array $result): JsonResponse
    {
        return response()->json($result['body'], $result['status']);
    }

    /** Streams a platform file with its type and name; errors keep the JSON envelope. */
    protected function sendFile(array $result): Response
    {
        if ($result['status'] !== 200) return $this->reply($result);
        return response($result['bytes'], 200, $result['headers'] + ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    protected function requireLogin(): ?JsonResponse
    {
        return session('syscon.refresh') ? null : response()->json(['success' => false, 'message' => 'Inicia sesión para continuar.'], 401);
    }

    /**
     * Without JWT_SECRET no token can be verified; answering 401 would look like an expired
     * session, so the misconfiguration is reported as a server error and logged.
     */
    protected function requireIdentityConfig(): ?JsonResponse
    {
        if ($this->identity->configured()) return null;
        Log::error('JWT_SECRET no está configurado en la web o tiene menos de 32 bytes; debe coincidir con el del Auth Service.');
        return response()->json(['success' => false, 'message' => 'El servicio de sesión no está configurado correctamente. Contacta al administrador.'], 500);
    }

    /** Verifies the session with Auth (refreshing the token if needed) and checks one permission. */
    protected function requirePermission(string $permission): ?JsonResponse
    {
        if ($error = $this->requireIdentityConfig()) return $error;
        if ($error = $this->requireLogin()) return $error;
        $verified = $this->api->authenticated('GET', '/api/auth/me');
        if ($verified['status'] !== 200) return $this->reply($verified);
        $claims = $this->identity->claims(session('syscon.access'));
        return in_array($permission, $claims['authorities'] ?? [], true) ? null : response()->json(['success' => false, 'message' => 'Acceso restringido.'], 403);
    }
}
