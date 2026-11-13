<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** Proxies /api/admin/pricing (catalog:write): reference prices and price suggestions. */
class PricingGatewayController extends GatewayController
{
    /** Forwards the request body as-is; the platform validates every field. */
    public function forward(Request $request, string $path = ''): JsonResponse
    {
        if ($error = $this->requirePermission('catalog:write')) return $error;
        $method = $request->method();
        $result = $this->api->authenticated($method, '/api/admin/pricing/'.$path, $method === 'GET' || $method === 'DELETE' ? null : $request->all());
        // An approved price changes what the store shows.
        if ($result['status'] < 300 && str_ends_with($path, '/approve')) Cache::forget('catalog.products');
        return $this->reply($result);
    }
}
