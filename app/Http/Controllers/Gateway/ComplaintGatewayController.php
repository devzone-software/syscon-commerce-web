<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Libro de Reclamaciones. Registering a sheet is public (with or without an account); reading
 * and answering the book is for the staff that manages orders.
 */
class ComplaintGatewayController extends GatewayController
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:RECLAMO,QUEJA',
            'consumerName' => 'required|string|min:3|max:255',
            'documentType' => 'required|in:DNI,CE,PASAPORTE,RUC',
            'documentNumber' => 'required|string|max:20',
            'address' => 'required|string|min:5|max:500',
            'phone' => 'required|string|max:30',
            'email' => 'required|email|max:255',
            'guardianName' => 'nullable|string|max:255',
            'itemType' => 'required|in:PRODUCTO,SERVICIO',
            'itemDescription' => 'required|string|min:3|max:500',
            'amount' => 'nullable|numeric|min:0',
            'orderReference' => 'nullable|string|max:100',
            'detail' => 'required|string|min:10|max:5000',
            'consumerRequest' => 'required|string|min:5|max:3000',
            'accepted' => 'accepted',
        ]);
        return $this->reply($this->api->request('POST', '/api/complaints', $data));
    }

    public function index(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('orders:manage')) return $error;
        $status = in_array($request->query('status'), ['PENDING', 'ANSWERED'], true) ? '?status='.$request->query('status') : '';
        return $this->reply($this->api->authenticated('GET', '/api/admin/complaints'.$status));
    }

    public function respond(Request $request, string $id): JsonResponse
    {
        if ($error = $this->requirePermission('orders:manage')) return $error;
        $data = $request->validate(['response' => 'required|string|min:10|max:5000']);
        return $this->reply($this->api->authenticated('POST', "/api/admin/complaints/$id/respond", $data));
    }
}
