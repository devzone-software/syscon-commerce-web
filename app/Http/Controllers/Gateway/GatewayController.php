<?php

namespace App\Http\Controllers\Gateway;

use App\Http\Controllers\Controller;
use App\Services\Identity;
use App\Services\JavaApi;
use Illuminate\Http\JsonResponse;

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

    protected function requireLogin(): ?JsonResponse
    {
        return session('syscon.refresh') ? null : response()->json(['success' => false, 'message' => 'Inicia sesión para continuar.'], 401);
    }

    /** Verifies the session with Auth (refreshing the token if needed) and checks one permission. */
    protected function requirePermission(string $permission): ?JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        $verified = $this->api->authenticated('GET', '/api/auth/me');
        if ($verified['status'] !== 200) return $this->reply($verified);
        $claims = $this->identity->claims(session('syscon.access'));
        return in_array($permission, $claims['authorities'] ?? [], true) ? null : response()->json(['success' => false, 'message' => 'Acceso restringido.'], 403);
    }
}
