<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Direct sales registered by staff (/api/admin/sales), which require sales:create. */
class SaleGatewayController extends GatewayController
{
    public function store(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('sales:create')) return $error;
        $data = $request->validate([
            'items' => 'required|array|min:1|max:100',
            'items.*.productId' => 'required|uuid|distinct',
            'items.*.quantity' => 'required|integer|min:1|max:1000000',
            'customerId' => 'nullable|uuid',
            'billing' => 'required|array',
            'billing.type' => 'required|in:01,03',
            'billing.documentType' => 'required|in:0,1,4,6,7',
            'billing.documentNumber' => 'required|string|max:15',
            'billing.name' => 'required|string|max:255',
            'billing.address' => 'nullable|string|max:255',
            'payment' => 'required|array',
            'payment.method' => 'required|in:CASH,CARD,YAPE,PLIN,TRANSFER',
            'payment.reference' => 'nullable|required_unless:payment.method,CASH|string|max:255',
            // The same key on a retry returns the registered sale instead of charging twice.
            'idempotencyKey' => 'required|uuid',
        ]);
        return $this->reply($this->api->authenticated('POST', '/api/admin/sales', $data));
    }

    public function customers(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('sales:create')) return $error;
        $data = $request->validate(['q' => 'required|string|min:2|max:120']);
        return $this->reply($this->api->authenticated('GET', '/api/admin/customers'.OrderGatewayController::query($data)));
    }
}
