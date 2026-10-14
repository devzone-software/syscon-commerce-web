<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentGatewayController extends GatewayController
{
    public function pay(Request $request): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        // SANDBOX is the simulated online gateway; the platform rejects it unless it is enabled.
        $data = $request->validate(['orderId' => 'required|uuid', 'provider' => 'required|in:MANUAL,SANDBOX']);
        return $this->reply($this->api->authenticated('POST', '/api/payments', $data));
    }

    /** Payment methods the checkout can offer (manual and enabled online gateways). */
    public function methods(): JsonResponse
    {
        return $this->reply($this->api->request('GET', '/api/payments/methods'));
    }

    public function payment(string $id): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/payments/$id"));
    }

    /** Backoffice inbox: pending manual payments by default, oldest first. */
    public function adminPayments(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('payments:confirm')) return $error;
        $data = $request->validate([
            'status' => 'nullable|in:PENDING,APPROVED,CANCELLED,REJECTED,REFUND_REQUIRED', 'q' => 'nullable|string|max:120',
            'page' => 'nullable|integer|min:1', 'perPage' => 'nullable|integer|min:1|max:100',
        ]);
        return $this->reply($this->api->authenticated('GET', '/api/admin/payments'.OrderGatewayController::query($data)));
    }

    public function confirmPayment(string $id, Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('payments:confirm')) return $error;
        $data = $request->validate(['reference' => 'required|string|max:255']);
        return $this->reply($this->api->authenticated('POST', "/api/payments/$id/confirm", $data));
    }
}
