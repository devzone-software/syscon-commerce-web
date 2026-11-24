<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** Wholesale purchases and internal use (/api/admin/purchases, /api/admin/internal-uses), requires inventory:manage. */
class InventoryGatewayController extends GatewayController
{
    public function purchases(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('inventory:manage')) return $error;
        if ($request->isMethod('GET')) {
            $data = $request->validate(['page' => 'nullable|integer|min:1']);
            return $this->reply($this->api->authenticated('GET', '/api/admin/purchases'.OrderGatewayController::query($data)));
        }
        $data = $request->validate([
            'supplierName' => 'required|string|min:2|max:255',
            'documentRef' => 'nullable|string|max:60',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1|max:100',
            'items.*.productId' => 'required|uuid|distinct',
            'items.*.quantity' => 'required|integer|min:1|max:100000',
            'items.*.unitCost' => 'required|decimal:0,2|gt:0|max:999999999.99',
        ]);
        return $this->stockChanged($this->api->authenticated('POST', '/api/admin/purchases', $data));
    }

    public function internalUses(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('inventory:manage')) return $error;
        if ($request->isMethod('GET')) {
            $data = $request->validate(['page' => 'nullable|integer|min:1']);
            return $this->reply($this->api->authenticated('GET', '/api/admin/internal-uses'.OrderGatewayController::query($data)));
        }
        $data = $request->validate([
            'productId' => 'required|uuid',
            'quantity' => 'required|integer|min:1|max:100000',
            'reason' => 'required|string|min:3|max:255',
        ]);
        return $this->stockChanged($this->api->authenticated('POST', '/api/admin/internal-uses', $data));
    }

    /** Both movements change the stock the store shows. */
    private function stockChanged(array $result): JsonResponse
    {
        if ($result['status'] < 300) Cache::forget('catalog.products');
        return $this->reply($result);
    }
}
