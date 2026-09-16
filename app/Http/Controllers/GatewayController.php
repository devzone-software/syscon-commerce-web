<?php

namespace App\Http\Controllers;

use App\Services\Identity;
use App\Services\JavaApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GatewayController extends Controller
{
    public function __construct(private JavaApi $api, private Identity $identity) {}

    private function reply(array $result): JsonResponse
    {
        return response()->json($result['body'], $result['status']);
    }

    private function requireLogin(): ?JsonResponse
    {
        return session('syscon.refresh') ? null : response()->json(['success' => false, 'message' => 'Inicia sesión para continuar.'], 401);
    }

    private function requireAdmin(): ?JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        $verified = $this->api->authenticated('GET', '/api/auth/me');
        if ($verified['status'] !== 200) return $this->reply($verified);
        $claims = $this->identity->claims(session('syscon.access'));
        return in_array('ROLE_ADMIN', $claims['authorities'] ?? [], true) ? null : response()->json(['success' => false, 'message' => 'Acceso restringido.'], 403);
    }

    public function catalog(string $kind): JsonResponse
    {
        $cached = Cache::get("catalog.$kind");
        if ($cached) return $this->reply($cached);
        $result = $this->api->request('GET', "/api/catalog/$kind");
        if ($result['status'] === 200) Cache::put("catalog.$kind", $result, 60);
        return $this->reply($result);
    }

    public function product(string $id): JsonResponse
    {
        return $this->reply($this->api->request('GET', "/api/catalog/products/$id"));
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email|max:255', 'password' => 'required|string|min:12|max:128']);
        return $this->reply($this->api->request('POST', '/api/auth/register', $data));
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $result = $this->api->request('POST', '/api/auth/login', $data);
        if ($result['status'] === 200 && isset($result['body']['data']['accessToken'], $result['body']['data']['refreshToken'])) {
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
        if ($error = $this->requireLogin()) return $error;
        $result = $this->api->authenticated('GET', '/api/auth/me');
        if ($result['status'] !== 200) return $this->reply($result);
        $claims = $this->identity->claims(session('syscon.access'));
        if (! $claims) return response()->json(['success' => false, 'message' => 'Sesión inválida.'], 401);
        return response()->json(['success' => true, 'data' => ['id' => $claims['sub'], 'email' => session('syscon.email'), 'roles' => array_values(array_filter($claims['authorities'] ?? [], fn ($a) => str_starts_with($a, 'ROLE_')))]]);
    }

    public function orders(Request $request): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        if ($request->isMethod('GET')) return $this->reply($this->api->authenticated('GET', '/api/orders'));
        $data = $request->validate(['items' => 'required|array|min:1|max:100', 'items.*.productId' => 'required|uuid|distinct', 'items.*.quantity' => 'required|integer|min:1|max:999']);
        return $this->reply($this->api->authenticated('POST', '/api/orders', $data));
    }

    public function order(string $id): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/orders/$id"));
    }

    public function pay(Request $request): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        $data = $request->validate(['orderId' => 'required|uuid', 'provider' => 'required|in:MANUAL']);
        return $this->reply($this->api->authenticated('POST', '/api/payments', $data));
    }

    public function payment(string $id): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/payments/$id"));
    }

    public function saveProduct(Request $request): JsonResponse
    {
        if ($error = $this->requireAdmin()) return $error;
        $data = $request->validate(['sku' => 'required|string|max:100', 'name' => 'required|string|max:255', 'price' => 'required|numeric|min:0', 'stock' => 'required|integer|min:0', 'imageUrl' => 'nullable|url|max:2048', 'category' => 'nullable|string|max:100', 'brand' => 'nullable|string|max:100', 'active' => 'required|boolean']);
        $result = $this->api->authenticated('POST', '/api/catalog/products', $data);
        if ($result['status'] < 300) Cache::forget('catalog.products');
        return $this->reply($result);
    }

    public function orderStatus(string $id, Request $request): JsonResponse
    {
        if ($error = $this->requireAdmin()) return $error;
        $data = $request->validate(['status' => 'required|in:PROCESSING,SHIPPED,DELIVERED,CANCELLED']);
        return $this->reply($this->api->authenticated('PATCH', "/api/orders/$id/status/{$data['status']}"));
    }

    public function confirmPayment(string $id, Request $request): JsonResponse
    {
        if ($error = $this->requireAdmin()) return $error;
        $data = $request->validate(['reference' => 'required|string|max:255']);
        return $this->reply($this->api->authenticated('POST', "/api/payments/$id/confirm", $data));
    }
}
