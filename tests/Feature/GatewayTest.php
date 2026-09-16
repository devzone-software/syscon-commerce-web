<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GatewayTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['services.java.url' => 'http://java.test', 'services.java.jwt_secret' => str_repeat('a', 40)]);
        Cache::flush();
    }

    private function token(array $roles = ['ROLE_CUSTOMER']): string
    {
        $encode = fn ($value) => rtrim(strtr(base64_encode(json_encode($value)), '+/', '-_'), '=');
        $header = $encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $body = $encode(['iss' => 'syscon-auth', 'sub' => '00000000-0000-0000-0000-000000000001', 'exp' => time() + 900, 'authorities' => $roles]);
        $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', "$header.$body", str_repeat('a', 40), true)), '+/', '-_'), '=');
        return "$header.$body.$signature";
    }

    public function test_catalog_reads_java_envelope(): void
    {
        Http::fake(['java.test/api/catalog/products' => Http::response(['success' => true, 'message' => 'Productos', 'data' => [['id' => '1']]], 200)]);
        $this->getJson('/web-api/catalog/products')->assertOk()->assertJsonPath('data.0.id', '1');
        Http::assertSentCount(1);
        $this->getJson('/web-api/catalog/products')->assertOk();
        Http::assertSentCount(1);
    }

    public function test_login_keeps_tokens_on_server_and_me_returns_identity(): void
    {
        $token = $this->token();
        Http::fake([
            'java.test/api/auth/login' => Http::response(['success' => true, 'data' => ['accessToken' => $token, 'refreshToken' => 'refresh-secret']], 200),
            'java.test/api/auth/me' => Http::response(['success' => true, 'data' => '00000000-0000-0000-0000-000000000001'], 200),
        ]);
        $response = $this->postJson('/web-api/login', ['email' => 'cliente@example.com', 'password' => 'very-long-password']);
        $response->assertOk()->assertHeader('X-CSRF-TOKEN')->assertDontSee('refresh-secret')->assertDontSee($token);
        $this->getJson('/web-api/me')->assertOk()->assertJsonPath('data.email', 'cliente@example.com')->assertJsonPath('data.roles.0', 'ROLE_CUSTOMER');
    }

    public function test_order_requires_session_and_valid_lines(): void
    {
        $this->postJson('/web-api/orders', ['items' => []])->assertUnauthorized();
        $this->withSession(['syscon' => ['access' => $this->token(), 'refresh' => 'refresh-secret']])
            ->postJson('/web-api/orders', ['items' => [['productId' => 'bad', 'quantity' => 0]]])->assertUnprocessable();
    }

    public function test_customer_cannot_write_catalog(): void
    {
        Http::fake(['java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200)]);
        $this->withSession(['syscon' => ['access' => $this->token(), 'refresh' => 'refresh-secret']])
            ->postJson('/web-api/admin/products', [])->assertForbidden();
        Http::assertSentCount(1);
    }
}
