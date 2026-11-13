<?php

namespace App\Http\Middleware;

use App\Services\JavaApi;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Closes a signed-in session after SESSION_IDLE_MINUTES without requests: the refresh token is
 * revoked on the platform and the session is emptied. The request then goes on as a guest, so
 * public pages keep working; protected ones answer 401 as for anyone signed out. The
 * X-Session-Expired header lets the page show why it has to sign in again.
 */
class SessionIdleTimeout
{
    public const SEEN = 'syscon.seen';

    public function __construct(private JavaApi $api) {}

    public function handle(Request $request, Closure $next): Response
    {
        $expired = false;
        $session = $request->session();
        $seen = $session->get(self::SEEN);
        if ($session->has('syscon.refresh') && is_int($seen) && now()->timestamp - $seen > self::idleSeconds()) {
            $this->api->request('POST', '/api/auth/logout', ['refreshToken' => $session->get('syscon.refresh')]);
            $session->invalidate();
            $session->regenerateToken();
            $expired = true;
        }

        $response = $next($request);

        // Any request of a signed-in visitor counts as activity, including the sign-in itself.
        if ($session->has('syscon.refresh')) $session->put(self::SEEN, now()->timestamp);
        if ($expired) {
            $response->headers->set('X-Session-Expired', '1');
            $response->headers->set('X-CSRF-TOKEN', csrf_token());
        }
        return $response;
    }

    public static function idleSeconds(): int
    {
        return max(1, (int) config('session.idle_minutes', 15)) * 60;
    }
}
