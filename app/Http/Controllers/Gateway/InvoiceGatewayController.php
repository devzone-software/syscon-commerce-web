<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

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
            'customerDocumentType' => 'nullable|in:0,1,4,6,7',
            'customerDocumentNumber' => 'nullable|string|max:15',
            'customerName' => 'nullable|string|max:255',
            'referencedSerialNumber' => ['nullable', 'required_if:type,07,08', 'string', 'regex:/^[FB][A-Z0-9]{3}-[1-9][0-9]{0,7}$/'],
            // Notes: reason code (catalog 09 credit / 10 debit) and its explanation; the platform
            // checks which codes apply to each type and that credits never exceed the original.
            'noteCode' => 'nullable|required_if:type,07,08|in:01,02,03,06,07,09',
            'noteReason' => 'nullable|required_if:type,07,08|string|max:250',
            // Return by item (credit 07) or amount with IGV (credit 09 and debit notes).
            'items' => 'nullable|array|max:100',
            'items.*.productId' => 'required|uuid|distinct',
            'items.*.quantity' => 'required|integer|min:1|max:100000',
            'amount' => 'nullable|decimal:0,2|gt:0|max:999999999999.99',
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
            'customerDocumentType' => 'required|in:0,1,4,6,7',
            'customerDocumentNumber' => 'required|string|max:15',
            'customerName' => 'required|string|max:255',
        ]);
        return $this->reply($this->api->authenticated('PATCH', "/api/invoices/$id", $data));
    }

    /** Voids an accepted document: voided notice (series F) or daily summary (series B). */
    public function void(string $id, Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        $data = $request->validate(['reason' => 'required|string|min:3|max:100']);
        return $this->reply($this->api->authenticated('POST', "/api/invoices/$id/void", $data));
    }

    public function checkVoid(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        return $this->reply($this->api->authenticated('POST', "/api/invoices/$id/void/check"));
    }

    /** No answer from SUNAT: queries the CDR or resends the same signed XML (never a new document). */
    public function reconcile(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        return $this->reply($this->api->authenticated('POST', "/api/invoices/$id/reconcile"));
    }

    /** PDF (with its draft/test warning), XML or CDR of any document, for billing staff. */
    public function file(string $id, string $format): Response
    {
        if ($error = $this->requirePermission('invoices:submit')) return $error;
        return $this->sendFile($this->api->download("/api/invoices/$id/$format"));
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
