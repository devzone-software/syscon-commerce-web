<?php

namespace App\Services;

class Identity
{
    public function claims(?string $token): ?array
    {
        if (! $token || ! config('services.java.jwt_secret')) {
            return null;
        }
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $body, $signature] = $parts;
        $decoded = json_decode($this->decode($header) ?: '', true);
        $claims = json_decode($this->decode($body) ?: '', true);
        $expected = hash_hmac('sha256', "$header.$body", config('services.java.jwt_secret'), true);
        if (($decoded['alg'] ?? null) !== 'HS256' || ! hash_equals($expected, $this->decode($signature) ?: '') || ! is_array($claims) || ($claims['iss'] ?? null) !== 'syscon-auth' || ($claims['exp'] ?? 0) <= time()) {
            return null;
        }
        return $claims;
    }

    private function decode(string $value): string|false
    {
        return base64_decode(strtr($value, '-_', '+/'), true);
    }
}
