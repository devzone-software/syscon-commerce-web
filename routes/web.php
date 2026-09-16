<?php

use App\Http\Controllers\GatewayController;
use Illuminate\Support\Facades\Route;

Route::prefix('web-api')->group(function () {
    Route::get('/catalog/{kind}', [GatewayController::class, 'catalog'])->whereIn('kind', ['products', 'categories', 'brands']);
    Route::get('/product/{id}', [GatewayController::class, 'product'])->whereUuid('id');
    Route::post('/register', [GatewayController::class, 'register']);
    Route::post('/login', [GatewayController::class, 'login']);
    Route::post('/logout', [GatewayController::class, 'logout']);
    Route::get('/me', [GatewayController::class, 'me']);
    Route::match(['get', 'post'], '/orders', [GatewayController::class, 'orders']);
    Route::get('/orders/{id}', [GatewayController::class, 'order'])->whereUuid('id');
    Route::post('/payments', [GatewayController::class, 'pay']);
    Route::get('/payments/{id}', [GatewayController::class, 'payment'])->whereUuid('id');
    Route::post('/admin/products', [GatewayController::class, 'saveProduct']);
    Route::patch('/admin/orders/{id}/status', [GatewayController::class, 'orderStatus'])->whereUuid('id');
    Route::post('/admin/payments/{id}/confirm', [GatewayController::class, 'confirmPayment'])->whereUuid('id');
});

Route::get('/{any?}', fn () => view('app'))->where('any', '^(?!web-api|up).*$');
