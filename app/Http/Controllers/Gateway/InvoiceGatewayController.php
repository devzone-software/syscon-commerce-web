<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Proxies invoice-service (/api/invoices), which requires invoices:submit. */
class InvoiceGatewayController extends GatewayController
{
    public function create(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        $data = $request->validate([
            'orderId' => 'required|uuid',
            'type' => 'required|in:01,03,07,08',
            'serialNumber' => ['required', 'string', 'regex:/^[FB][A-Z0-9]{3}-[1-9][0-9]{0,7}$/'],
            // SUNAT catalog 06: DNI, carné de extranjería, RUC, pasaporte.
            'customerDocumentType' => 'required|in:1,4,6,7',
            'customerDocumentNumber' => 'required|string|max:15',
            'customerName' => 'required|string|max:255',
            'referencedSerialNumber' => ['nullable', 'required_if:type,07,08', 'string', 'regex:/^[FB][A-Z0-9]{3}-[1-9][0-9]{0,7}$/'],
        ]);
        return $this->reply($this->api->authenticated('POST', '/api/invoices', $data));
    }

    public function show(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/invoices/$id"));
    }

    public function submit(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        return $this->reply($this->api->authenticated('POST', "/api/invoices/$id/submit"));
    }
}
