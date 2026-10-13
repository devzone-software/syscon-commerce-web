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

    private function token(array $roles = ['ROLE_CUSTOMER'], array $extra = []): string
    {
        $encode = fn ($value) => rtrim(strtr(base64_encode(json_encode($value)), '+/', '-_'), '=');
        $header = $encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $body = $encode(['iss' => 'syscon-auth', 'sub' => '00000000-0000-0000-0000-000000000001', 'exp' => time() + 900, 'authorities' => $roles] + $extra);
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

    public function test_google_sign_in_opens_a_session_with_the_token_identity(): void
    {
        $token = $this->token(['ROLE_CUSTOMER'], ['email' => 'ana@gmail.com', 'given_name' => 'Ana', 'family_name' => 'Pérez']);
        Http::fake([
            'java.test/api/auth/google' => Http::response(['success' => true, 'data' => ['accessToken' => $token, 'refreshToken' => 'refresh-secret', 'created' => true]], 200),
            'java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200),
        ]);
        $this->postJson('/web-api/login/google', ['credential' => 'google-id-token'])
            ->assertOk()->assertJsonPath('data.created', true)->assertDontSee('refresh-secret');
        Http::assertSent(fn ($request) => $request->url() === 'http://java.test/api/auth/google' && $request['credential'] === 'google-id-token');
        $this->getJson('/web-api/me')->assertOk()->assertJsonPath('data.email', 'ana@gmail.com')->assertJsonPath('data.firstName', 'Ana');
    }

    public function test_register_requires_the_full_profile(): void
    {
        Http::fake(['java.test/api/auth/register' => Http::response(['success' => true, 'data' => 'id'], 201)]);
        $profile = ['email' => 'ana@mail.com', 'password' => 'very-long-password', 'password_confirmation' => 'very-long-password', 'firstName' => 'Ana', 'lastName' => 'Pérez', 'documentType' => 'DNI', 'documentNumber' => '12345678', 'phone' => '987654321'];
        $this->postJson('/web-api/register', ['email' => 'ana@mail.com', 'password' => 'very-long-password'])->assertUnprocessable();
        $this->postJson('/web-api/register', ['phone' => '12345'] + $profile)->assertUnprocessable();
        $this->postJson('/web-api/register', ['password_confirmation' => 'otra-cosa-distinta'] + $profile)->assertUnprocessable();
        $this->postJson('/web-api/register', $profile)->assertStatus(201);
        Http::assertSent(fn ($request) => $request->url() === 'http://java.test/api/auth/register' && $request['documentNumber'] === '12345678' && ! isset($request['password_confirmation']));
    }

    public function test_me_separates_roles_from_permissions(): void
    {
        Http::fake(['java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200)]);
        $this->withSession(['syscon' => ['access' => $this->token(['ROLE_ADMIN', 'orders:manage']), 'refresh' => 'refresh-secret', 'email' => 'admin@example.com']])
            ->getJson('/web-api/me')->assertOk()
            ->assertJsonPath('data.roles', ['ROLE_ADMIN'])
            ->assertJsonPath('data.permissions', ['orders:manage']);
    }

    public function test_order_requires_session_and_valid_lines(): void
    {
        $this->postJson('/web-api/orders', ['items' => []])->assertUnauthorized();
        $this->withSession(['syscon' => ['access' => $this->token(), 'refresh' => 'refresh-secret']])
            ->postJson('/web-api/orders', ['items' => [['productId' => 'bad', 'quantity' => 0]]])->assertUnprocessable();
    }

    public function test_order_forwards_billing_and_requires_it(): void
    {
        Http::fake(['java.test/api/orders' => Http::response(['success' => true, 'data' => ['id' => 'o1', 'billing' => ['type' => '03']]], 200)]);
        $session = ['syscon' => ['access' => $this->token(), 'refresh' => 'refresh-secret']];
        $items = [['productId' => '00000000-0000-0000-0000-0000000000aa', 'quantity' => 1]];
        $billing = ['type' => '03', 'documentType' => '1', 'documentNumber' => '12345678', 'name' => 'Ana Quispe', 'address' => null];
        $delivery = ['method' => 'PICKUP', 'contactName' => 'Ana Quispe', 'contactPhone' => '987654321'];
        $key = '7b0f2c9e-1d3a-4c5b-8e6f-0a1b2c3d4e5f';
        $order = ['items' => $items, 'billing' => $billing, 'delivery' => $delivery, 'idempotencyKey' => $key];
        $this->withSession($session)->postJson('/web-api/orders', ['items' => $items])->assertUnprocessable();
        $this->withSession($session)->postJson('/web-api/orders', ['billing' => ['type' => '07'] + $billing] + $order)->assertUnprocessable();
        $this->withSession($session)->postJson('/web-api/orders', ['delivery' => ['method' => 'DELIVERY'] + $delivery] + $order)->assertUnprocessable();
        $this->withSession($session)->postJson('/web-api/orders', array_diff_key($order, ['idempotencyKey' => 1]))->assertUnprocessable();
        $this->withSession($session)->postJson('/web-api/orders', $order)->assertOk()->assertJsonPath('data.id', 'o1');
        Http::assertSent(fn ($request) => $request->url() === 'http://java.test/api/orders' && $request['billing']['documentNumber'] === '12345678' && $request['delivery']['method'] === 'PICKUP' && $request['idempotencyKey'] === $key);
    }

    public function test_delivery_options_are_public(): void
    {
        Http::fake(['java.test/api/orders/delivery-options' => Http::response(['success' => true, 'data' => ['delivery' => ['enabled' => true, 'cost' => '15.00']]], 200)]);
        $this->getJson('/web-api/delivery-options')->assertOk()->assertJsonPath('data.delivery.cost', '15.00');
    }

    public function test_profile_requires_session_and_proxies_platform(): void
    {
        Http::fake(['java.test/api/auth/profile' => Http::response(['success' => true, 'data' => ['documentType' => 'DNI', 'documentNumber' => '12345678']], 200)]);
        $this->getJson('/web-api/profile')->assertUnauthorized();
        $this->withSession(['syscon' => ['access' => $this->token(), 'refresh' => 'refresh-secret']])
            ->getJson('/web-api/profile')->assertOk()->assertJsonPath('data.documentNumber', '12345678');
    }

    public function test_customer_cannot_write_catalog(): void
    {
        Http::fake(['java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200)]);
        $this->withSession(['syscon' => ['access' => $this->token(), 'refresh' => 'refresh-secret']])
            ->postJson('/web-api/admin/products', [])->assertForbidden();
        Http::assertSentCount(1);
    }

    public function test_staff_permission_is_enough_without_admin_role(): void
    {
        $id = '00000000-0000-0000-0000-0000000000aa';
        Http::fake([
            'java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200),
            "java.test/api/orders/$id/status/PROCESSING" => Http::response(['success' => true, 'data' => ['id' => $id, 'status' => 'PROCESSING']], 200),
        ]);
        $this->withSession(['syscon' => ['access' => $this->token(['ROLE_OPERATOR', 'orders:manage']), 'refresh' => 'refresh-secret']])
            ->patchJson("/web-api/admin/orders/$id/status", ['status' => 'PROCESSING'])->assertOk()->assertJsonPath('data.status', 'PROCESSING');
    }

    public function test_admin_role_without_permission_is_rejected(): void
    {
        Http::fake(['java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200)]);
        $this->withSession(['syscon' => ['access' => $this->token(['ROLE_ADMIN']), 'refresh' => 'refresh-secret']])
            ->postJson('/web-api/admin/payments/00000000-0000-0000-0000-0000000000aa/confirm', ['reference' => 'op-1'])->assertForbidden();
    }

    public function test_admin_inboxes_forward_filters_and_require_permissions(): void
    {
        Http::fake([
            'java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200),
            'java.test/api/admin/orders*' => Http::response(['success' => true, 'data' => ['items' => [], 'total' => 0]], 200),
            'java.test/api/admin/payments*' => Http::response(['success' => true, 'data' => ['items' => [], 'total' => 0]], 200),
        ]);
        $orders = ['syscon' => ['access' => $this->token(['ROLE_OPERATOR', 'orders:manage']), 'refresh' => 'r']];
        $this->withSession($orders)->getJson('/web-api/admin/orders?status=PAID,PROCESSING&q=ana&page=2&from=')->assertOk();
        Http::assertSent(fn ($request) => $request->url() === 'http://java.test/api/admin/orders?status=PAID%2CPROCESSING&q=ana&page=2');
        $this->withSession($orders)->getJson('/web-api/admin/orders?status=paid;drop')->assertUnprocessable();
        $this->withSession($orders)->getJson('/web-api/admin/payments')->assertForbidden();
        $payments = ['syscon' => ['access' => $this->token(['ROLE_OPERATOR', 'payments:confirm']), 'refresh' => 'r']];
        $this->withSession($payments)->getJson('/web-api/admin/orders')->assertForbidden();
        $this->withSession($payments)->getJson('/web-api/admin/payments?status=PENDING')->assertOk();
        Http::assertSent(fn ($request) => $request->url() === 'http://java.test/api/admin/payments?status=PENDING');
        $this->withSession($payments)->getJson('/web-api/admin/payments?status=REFUNDED')->assertUnprocessable();
    }

    public function test_saving_a_product_clears_catalog_caches(): void
    {
        Cache::put('catalog.categories', ['status' => 200, 'body' => ['success' => true, 'data' => []]], 60);
        Http::fake([
            'java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200),
            'java.test/api/catalog/products' => Http::response(['success' => true, 'data' => ['id' => '1']], 200),
        ]);
        $this->withSession(['syscon' => ['access' => $this->token(['ROLE_ADMIN', 'catalog:write']), 'refresh' => 'refresh-secret']])
            ->postJson('/web-api/admin/products', ['sku' => 'A1', 'name' => 'Router', 'price' => 10, 'stock' => 2, 'active' => true])->assertOk();
        $this->assertNull(Cache::get('catalog.categories'));
    }

    public function test_suppliers_require_permission_and_https_feed(): void
    {
        Http::fake([
            'java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200),
            'java.test/api/suppliers' => Http::response(['success' => true, 'data' => ['id' => 's1']], 200),
        ]);
        $this->withSession(['syscon' => ['access' => $this->token(['ROLE_ADMIN', 'catalog:write']), 'refresh' => 'r']])
            ->getJson('/web-api/admin/suppliers')->assertForbidden();
        $session = ['syscon' => ['access' => $this->token(['ROLE_ADMIN', 'suppliers:manage']), 'refresh' => 'r']];
        $this->withSession($session)->postJson('/web-api/admin/suppliers', ['name' => 'P', 'feedUrl' => 'http://p.test/feed.csv', 'minIntervalMinutes' => 15])->assertUnprocessable();
        $this->withSession($session)->postJson('/web-api/admin/suppliers', ['name' => 'P', 'feedUrl' => 'https://p.test/feed.csv', 'minIntervalMinutes' => 15])->assertOk();
    }

    public function test_invoices_validate_series_and_references(): void
    {
        Http::fake([
            'java.test/api/auth/me' => Http::response(['success' => true, 'data' => 'id'], 200),
            'java.test/api/invoices' => Http::response(['success' => true, 'data' => ['id' => 'i1', 'status' => 'DRAFT']], 200),
        ]);
        $session = ['syscon' => ['access' => $this->token(['ROLE_ADMIN', 'invoices:submit']), 'refresh' => 'r']];
        $base = ['orderId' => '00000000-0000-0000-0000-0000000000aa', 'type' => '03', 'serialNumber' => 'B001-1', 'customerDocumentType' => '1', 'customerDocumentNumber' => '12345678', 'customerName' => 'Cliente'];
        $this->withSession($session)->postJson('/web-api/admin/invoices', [...$base, 'serialNumber' => 'B001-0'])->assertUnprocessable();
        $this->withSession($session)->postJson('/web-api/admin/invoices', [...$base, 'type' => '07'])->assertUnprocessable();
        $this->withSession($session)->postJson('/web-api/admin/invoices', $base)->assertOk()->assertJsonPath('data.status', 'DRAFT');
        // Customer data may be omitted: the platform takes it from the order billing.
        $this->withSession($session)->postJson('/web-api/admin/invoices', array_diff_key($base, array_flip(['customerDocumentType', 'customerDocumentNumber', 'customerName'])))->assertOk();
    }

    public function test_login_rejects_tokens_the_web_cannot_verify(): void
    {
        config(['services.java.jwt_secret' => str_repeat('b', 40)]);
        Http::fake(['java.test/api/auth/login' => Http::response(['success' => true, 'data' => ['accessToken' => $this->token(), 'refreshToken' => 'refresh-secret']], 200)]);
        $this->postJson('/web-api/login', ['email' => 'admin@example.com', 'password' => 'very-long-password'])->assertStatus(502)->assertDontSee('refresh-secret');
        $this->assertNull(session('syscon.refresh'));
        $this->getJson('/web-api/me')->assertUnauthorized();
    }

    public function test_missing_jwt_secret_is_reported_as_configuration_error(): void
    {
        config(['services.java.jwt_secret' => null]);
        Http::fake();
        $this->postJson('/web-api/login', ['email' => 'admin@example.com', 'password' => 'very-long-password'])->assertStatus(500);
        $this->withSession(['syscon' => ['access' => $this->token(), 'refresh' => 'refresh-secret']])->getJson('/web-api/me')->assertStatus(500);
        Http::assertNothingSent();
    }

    public function test_logout_invalidates_the_session(): void
    {
        Http::fake(['java.test/api/auth/logout' => Http::response(['success' => true, 'data' => null], 200)]);
        $this->withSession(['syscon' => ['access' => $this->token(), 'refresh' => 'refresh-secret']])
            ->postJson('/web-api/logout')->assertOk()->assertHeader('X-CSRF-TOKEN');
        $this->assertNull(session('syscon.refresh'));
        $this->getJson('/web-api/me')->assertUnauthorized();
    }
}
