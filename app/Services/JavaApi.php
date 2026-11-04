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

    /**
     * File download (PDF, XML, CDR) with the session token. Returns the raw bytes and the headers
     * the browser needs; errors keep the platform's JSON envelope in `body`.
     *
     * @return array{status: int, bytes?: string, headers?: array<string, string>, body?: array}
     */
    public function download(string $path): array
    {
        $fetch = function () use ($path) {
            try {
                $response = Http::baseUrl(rtrim(config('services.java.url'), '/'))->timeout(30)
                    ->withToken((string) session('syscon.access'))->get($path);
            } catch (ConnectionException) {
                return ['status' => 503, 'body' => ['success' => false, 'message' => 'El servicio no está disponible.']];
            }
            if (! $response->successful()) {
                $body = $response->json();
                return ['status' => $response->status(), 'body' => is_array($body) ? $body : ['success' => false, 'message' => 'Archivo no disponible.']];
            }
            $headers = ['Content-Type' => $response->header('Content-Type') ?: 'application/octet-stream'];
            if ($disposition = $response->header('Content-Disposition')) $headers['Content-Disposition'] = $disposition;
            return ['status' => 200, 'bytes' => $response->body(), 'headers' => $headers];
        };
        $result = $fetch();
        if ($result['status'] === 401 && $this->renew()) $result = $fetch();
        return $result;
    }

    /** Exchanges the refresh token for a new pair; false (and logged out) when it is no longer valid. */
    private function renew(): bool
    {
        if (! session('syscon.refresh')) return false;
        $renewed = $this->request('POST', '/api/auth/refresh', ['refreshToken' => session('syscon.refresh')]);
        if ($renewed['status'] !== 200 || ! isset($renewed['body']['data']['accessToken'], $renewed['body']['data']['refreshToken'])) {
            session()->forget('syscon');
            return false;
        }
        session(['syscon.access' => $renewed['body']['data']['accessToken'], 'syscon.refresh' => $renewed['body']['data']['refreshToken']]);
        return true;
    }

    public function authenticated(string $method, string $path, ?array $payload = null): array
    {
        $token = session('syscon.access');
        $result = $this->request($method, $path, $payload, $token);
        if ($result['status'] !== 401 || ! $this->renew()) {
            return $result;
        }
        return $this->request($method, $path, $payload, session('syscon.access'));
    }
}
