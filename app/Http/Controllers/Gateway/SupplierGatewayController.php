<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** Proxies supplier-service (/api/suppliers), which requires suppliers:manage. */
class SupplierGatewayController extends GatewayController
{
    public function suppliers(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('suppliers:manage')) return $error;
        if ($request->isMethod('GET')) return $this->reply($this->api->authenticated('GET', '/api/suppliers'));
        $data = $request->validate(['name' => 'required|string|max:255', 'feedUrl' => 'required|url|starts_with:https://|max:2048', 'minIntervalMinutes' => 'required|integer|min:15|max:10080']);
        return $this->reply($this->api->authenticated('POST', '/api/suppliers', $data));
    }

    public function run(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('suppliers:manage')) return $error;
        $result = $this->api->authenticated('POST', "/api/suppliers/$id/run");
        // The import upserts catalog products.
        if ($result['status'] < 300) foreach (['products', 'categories', 'brands'] as $kind) Cache::forget("catalog.$kind");
        return $this->reply($result);
    }

    public function jobs(): JsonResponse
    {
        if ($error = $this->requirePermission('suppliers:manage')) return $error;
        return $this->reply($this->api->authenticated('GET', '/api/suppliers/jobs'));
    }

    public function history(string $id): JsonResponse
    {
        if ($error = $this->requirePermission('suppliers:manage')) return $error;
        return $this->reply($this->api->authenticated('GET', "/api/suppliers/jobs/$id/history"));
    }
}
