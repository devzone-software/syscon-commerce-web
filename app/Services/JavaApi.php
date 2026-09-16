<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class JavaApi
{
    public function request(string $method, string $path, ?array $payload = null, ?string $token = null): array
    {
        try {
            $request = Http::baseUrl(rtrim(config('services.java.url'), '/'))
                ->acceptJson()->asJson()->timeout(10);
            if ($token) {
                $request = $request->withToken($token);
            }
            $response = $request->send($method, $path, $payload === null ? [] : ['json' => $payload]);
            $body = $response->json();
            if (! is_array($body)) {
                return ['status' => 502, 'body' => ['success' => false, 'message' => 'Respuesta inválida del servicio.']];
            }
            return ['status' => $response->status(), 'body' => $body];
        } catch (ConnectionException) {
            return ['status' => 503, 'body' => ['success' => false, 'message' => 'El servicio no está disponible.']];
        }
    }

    public function authenticated(string $method, string $path, ?array $payload = null): array
    {
        $token = session('syscon.access');
        $result = $this->request($method, $path, $payload, $token);
        if ($result['status'] !== 401 || ! session('syscon.refresh')) {
            return $result;
        }
        $renewed = $this->request('POST', '/api/auth/refresh', ['refreshToken' => session('syscon.refresh')]);
        if ($renewed['status'] !== 200 || ! isset($renewed['body']['data']['accessToken'], $renewed['body']['data']['refreshToken'])) {
            session()->forget('syscon');
            return $result;
        }
        session(['syscon.access' => $renewed['body']['data']['accessToken'], 'syscon.refresh' => $renewed['body']['data']['refreshToken']]);
        return $this->request($method, $path, $payload, session('syscon.access'));
    }
}
