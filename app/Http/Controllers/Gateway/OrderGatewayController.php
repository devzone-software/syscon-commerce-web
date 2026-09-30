<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderGatewayController extends GatewayController
{
    public function orders(Request $request): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        if ($request->isMethod('GET')) return $this->reply($this->api->authenticated('GET', '/api/orders'));
        $data = $request->validate(['items' => 'required|array|min:1|max:100', 'items.*.productId' => 'required|uuid|distinct', 'items.*.quantity' => 'required|integer|min:1|max:999']);
        return $this->reply($this->api->authenticated('POST', '/api/orders', $data));
    }

    /** Owners and users with orders:manage can read an order; Java enforces it. */
    public function order(string $id): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/orders/$id"));
    }

    public function orderStatus(string $id, Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('orders:manage')) return $error;
        $data = $request->validate(['status' => 'required|in:PROCESSING,SHIPPED,DELIVERED,CANCELLED']);
        return $this->reply($this->api->authenticated('PATCH', "/api/orders/$id/status/{$data['status']}"));
    }
}
