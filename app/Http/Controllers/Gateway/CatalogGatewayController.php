<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CatalogGatewayController extends GatewayController
{
    public function catalog(string $kind): JsonResponse
    {
        $cached = Cache::get("catalog.$kind");
        if ($cached) return $this->reply($cached);
        $result = $this->api->request('GET', "/api/catalog/$kind");
        if ($result['status'] === 200) Cache::put("catalog.$kind", $result, 60);
        return $this->reply($result);
    }

    public function product(string $id): JsonResponse
    {
        return $this->reply($this->api->request('GET', "/api/catalog/products/$id"));
    }

    public function saveProduct(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('catalog:write')) return $error;
        $data = $request->validate(['sku' => 'required|string|max:100', 'name' => 'required|string|max:255', 'price' => 'required|numeric|min:0', 'stock' => 'required|integer|min:0', 'imageUrl' => 'nullable|url|max:2048', 'category' => 'nullable|string|max:100', 'brand' => 'nullable|string|max:100', 'active' => 'required|boolean']);
        $result = $this->api->authenticated('POST', '/api/catalog/products', $data);
        // Upserts can also create categories and brands.
        if ($result['status'] < 300) foreach (['products', 'categories', 'brands'] as $kind) Cache::forget("catalog.$kind");
        return $this->reply($result);
    }
}
