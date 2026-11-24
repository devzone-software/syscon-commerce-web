<?php

namespace App\Http\Controllers\Gateway;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Staff accounts (/api/admin/users, users:manage) and the staff audit log (/api/admin/audit, audit:view): superadmin only. */
class UserGatewayController extends GatewayController
{
    public function users(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('users:manage')) return $error;
        if ($request->isMethod('GET')) {
            $data = $request->validate([
                'role' => 'nullable|in:SUPERADMIN,ADMIN,CUSTOMER',
                'status' => 'nullable|in:ACTIVE,PENDING,SUSPENDED',
                'q' => 'nullable|string|max:100',
                'page' => 'nullable|integer|min:1',
            ]);
            return $this->reply($this->api->authenticated('GET', '/api/admin/users'.OrderGatewayController::query($data)));
        }
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'firstName' => 'required|string|max:80',
            'lastName' => 'required|string|max:80',
            'documentType' => 'required|in:DNI,CE,PASAPORTE',
            'documentNumber' => 'required|string|max:15',
            'phone' => ['required', 'regex:/^9\d{8}$/'],
        ]);
        return $this->reply($this->api->authenticated('POST', '/api/admin/users', $data));
    }

    /** validate, suspend, reactivate or reset-password; the platform decides which ones apply. */
    public function action(string $id, string $action): JsonResponse
    {
        if ($error = $this->requirePermission('users:manage')) return $error;
        return $this->reply($this->api->authenticated('POST', "/api/admin/users/$id/$action"));
    }

    /** Customer to admin or back; superadmins are not changed from here. */
    public function role(Request $request, string $id): JsonResponse
    {
        if ($error = $this->requirePermission('users:manage')) return $error;
        $data = $request->validate(['role' => 'required|in:ADMIN,CUSTOMER']);
        return $this->reply($this->api->authenticated('POST', "/api/admin/users/$id/role", $data));
    }

    /** Permissions of one admin, or back to the standard set with default=true. */
    public function permissions(Request $request, string $id): JsonResponse
    {
        if ($error = $this->requirePermission('users:manage')) return $error;
        $data = $request->validate([
            'default' => 'sometimes|boolean',
            'permissions' => 'required_unless:default,true|array|max:20',
            'permissions.*' => 'string|max:40',
        ]);
        return $this->reply($this->api->authenticated('PUT', "/api/admin/users/$id/permissions", $data));
    }

    public function audit(Request $request): JsonResponse
    {
        if ($error = $this->requirePermission('audit:view')) return $error;
        $data = $request->validate([
            'userId' => 'nullable|uuid',
            'role' => 'nullable|in:SUPERADMIN,ADMIN',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d',
            'page' => 'nullable|integer|min:1',
        ]);
        return $this->reply($this->api->authenticated('GET', '/api/admin/audit'.OrderGatewayController::query($data)));
    }
}
