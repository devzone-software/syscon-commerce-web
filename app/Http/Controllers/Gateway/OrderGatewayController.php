<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrderGatewayController extends GatewayController
{
    public function orders(Request $request): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        if ($request->isMethod('GET')) return $this->reply($this->api->authenticated('GET', '/api/orders'));
        // Shape only: the platform owns the document rules (DNI, RUC check digit, factura needs RUC).
        $data = $request->validate([
            'items' => 'required|array|min:1|max:100', 'items.*.productId' => 'required|uuid|distinct', 'items.*.quantity' => 'required|integer|min:1|max:999',
            'billing' => 'required|array',
            'billing.type' => 'required|in:01,03',
            'billing.documentType' => 'required|in:1,4,6,7',
            'billing.documentNumber' => 'required|string|max:15',
            'billing.name' => 'required|string|max:255',
            'billing.address' => 'nullable|string|max:255',
            'delivery' => 'required|array',
            'delivery.method' => 'required|in:PICKUP,DELIVERY',
            'delivery.contactName' => 'required|string|max:120',
            'delivery.contactPhone' => 'required|string|max:11',
            'delivery.address' => 'nullable|required_if:delivery.method,DELIVERY|string|max:255',
            'delivery.district' => 'nullable|required_if:delivery.method,DELIVERY|string|max:80',
            'delivery.reference' => 'nullable|string|max:255',
            // Same key on a retry: the platform returns the order already created.
            'idempotencyKey' => 'required|uuid',
        ]);
        return $this->reply($this->api->authenticated('POST', '/api/orders', $data));
    }

    /** Public: pickup and home delivery options with the cost the platform will charge. */
    public function deliveryOptions(): JsonResponse
    {
        return $this->reply($this->api->request('GET', '/api/orders/delivery-options'));
    }

    /** Owners and users with orders:manage can read an order; Java enforces it. */
    public function order(string $id): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/orders/$id"));
    }

    /** The customer's documents for one order: the platform lists only accepted ones they own. */
    public function invoices(string $id): JsonResponse
    {
        if ($error = $this->requireLogin()) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/orders/$id/invoices"));
    }

    public function invoiceFile(string $id, string $invoice, string $format): Response
    {
        if ($error = $this->requireLogin()) return $error;
        return $this->sendFile($this->api->download("/api/orders/$id/invoices/$invoice/$format"));
    }

    /** Backoffice inbox: every customer's orders, paginated and filtered by the platform. */
    public function adminOrders(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('orders:manage')) return $error;
        $data = $request->validate([
            'status' => ['nullable', 'string', 'max:200', 'regex:/^[A-Z_]+(,[A-Z_]+)*$/'], 'q' => 'nullable|string|max:120',
            'from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from',
            'page' => 'nullable|integer|min:1', 'perPage' => 'nullable|integer|min:1|max:100',
        ]);
        return $this->reply($this->api->authenticated('GET', '/api/admin/orders'.self::query($data)));
    }

    /** Order with its customer, payments, invoices and history. */
    public function adminOrder(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('orders:manage')) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/admin/orders/$id"));
    }

    public function orderStatus(string $id, Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('orders:manage')) return $error;
        $data = $request->validate(['status' => 'required|in:PROCESSING,SHIPPED,DELIVERED,CANCELLED']);
        return $this->reply($this->api->authenticated('PATCH', "/api/orders/$id/status/{$data['status']}"));
    }

    /** Query string with the filters that were actually sent. */
    public static function query(array $filters): string
    {
        $filters = array_filter($filters, fn ($value) => $value !== null && $value !== '');
        return $filters ? '?'.http_build_query($filters) : '';
    }
}
