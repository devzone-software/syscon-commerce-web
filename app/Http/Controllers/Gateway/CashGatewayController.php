<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Cash register of the staff member (/api/admin/cash), requires cash:manage. */
class CashGatewayController extends GatewayController
{
    private const MONEY = 'required|decimal:0,2|min:0|max:999999999.99';

    public function current(): JsonResponse
    {
        if ($error = $this->requirePermission('cash:manage')) return $error;
        return $this->reply($this->api->authenticated('GET', '/api/admin/cash/current'));
    }

    public function open(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('cash:manage')) return $error;
        $data = $request->validate(['openingAmount' => self::MONEY]);
        return $this->reply($this->api->authenticated('POST', '/api/admin/cash/open', $data));
    }

    public function movement(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('cash:manage')) return $error;
        $data = $request->validate([
            'type' => 'required|in:IN,OUT',
            'amount' => 'required|decimal:0,2|gt:0|max:999999999.99',
            'reason' => 'required|string|min:3|max:255',
        ]);
        return $this->reply($this->api->authenticated('POST', '/api/admin/cash/movements', $data));
    }

    public function close(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('cash:manage')) return $error;
        $data = $request->validate(['countedCash' => self::MONEY, 'notes' => 'nullable|string|max:500']);
        return $this->reply($this->api->authenticated('POST', '/api/admin/cash/close', $data));
    }

    public function sessions(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('cash:manage')) return $error;
        $data = $request->validate(['page' => 'nullable|integer|min:1', 'perPage' => 'nullable|integer|min:1|max:100']);
        return $this->reply($this->api->authenticated('GET', '/api/admin/cash/sessions'.OrderGatewayController::query($data)));
    }
}
