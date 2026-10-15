<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Proxies the platform sales reports (/api/admin/reports), which require reports:view. */
class ReportGatewayController extends GatewayController
{
    public function summary(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('reports:view')) return $error;
        return $this->reply($this->api->authenticated('GET', '/api/admin/reports/summary'.OrderGatewayController::query($this->period($request))));
    }

    /** JSON page of sales, or the whole period as CSV when `format=csv`. */
    public function sales(Request $request): JsonResponse|Response
    {
        if ($error = $this->requirePermission('reports:view')) return $error;
        $filters = $this->period($request) + $request->validate([
            'page' => 'nullable|integer|min:1', 'perPage' => 'nullable|integer|min:1|max:100',
            'mismatched' => 'nullable|in:0,1', 'format' => 'nullable|in:json,csv',
        ]);
        $path = '/api/admin/reports/sales'.OrderGatewayController::query($filters);
        if (($filters['format'] ?? 'json') === 'csv') return $this->sendFile($this->api->download($path));
        return $this->reply($this->api->authenticated('GET', $path));
    }

    private function period(Request $request): array
    {
        return $request->validate([
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d|after_or_equal:from',
        ]);
    }
}
