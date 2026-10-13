<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Proxies the platform invoices module (/api/invoices), which requires invoices:submit. */
class InvoiceGatewayController extends GatewayController
{
    private const SERIES = 'regex:/^[FB][A-Z0-9]{3}$/';

    /** The platform assigns series and number; `series` only picks one of the configured ones. */
    public function create(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        $data = $request->validate([
            'orderId' => 'required|uuid',
            'type' => 'required|in:01,03,07,08',
            'series' => ['nullable', 'string', self::SERIES],
            // SUNAT catalog 06: DNI, carné de extranjería, RUC, pasaporte. When omitted the
            // platform uses the billing data the customer chose for the order.
            'customerDocumentType' => 'nullable|in:1,4,6,7',
            'customerDocumentNumber' => 'nullable|string|max:15',
            'customerName' => 'nullable|string|max:255',
            'referencedSerialNumber' => ['nullable', 'required_if:type,07,08', 'string', 'regex:/^[FB][A-Z0-9]{3}-[1-9][0-9]{0,7}$/'],
        ]);
        return $this->reply($this->api->authenticated('POST', '/api/invoices', $data));
    }

    public function show(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/invoices/$id"));
    }

    /** Customer correction; the platform only accepts it while the invoice is a draft. */
    public function update(string $id, Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        $data = $request->validate([
            'customerDocumentType' => 'required|in:1,4,6,7',
            'customerDocumentNumber' => 'required|string|max:15',
            'customerName' => 'required|string|max:255',
        ]);
        return $this->reply($this->api->authenticated('PATCH', "/api/invoices/$id", $data));
    }

    public function submit(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        return $this->reply($this->api->authenticated('POST', "/api/invoices/$id/submit"));
    }

    public function series(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        if ($request->isMethod('GET')) return $this->reply($this->api->authenticated('GET', '/api/invoices/series'));
        $data = $request->validate([
            'type' => 'required|in:01,03,07,08',
            'series' => ['required', 'string', self::SERIES],
            'startAfter' => 'nullable|integer|min:0|max:99999998',
        ]);
        return $this->reply($this->api->authenticated('POST', '/api/invoices/series', $data));
    }

    public function updateSeries(int $id, Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        $data = $request->validate(['active' => 'required|boolean']);
        return $this->reply($this->api->authenticated('PATCH', "/api/invoices/series/$id", $data));
    }
}
