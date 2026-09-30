<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentGatewayController extends GatewayController
{
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

    public function confirmPayment(string $id, Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('payments:confirm')) return $error;
        $data = $request->validate(['reference' => 'required|string|max:255']);
        return $this->reply($this->api->authenticated('POST', "/api/payments/$id/confirm", $data));
    }
}
