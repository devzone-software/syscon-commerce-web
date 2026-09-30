<?php

use App\Http\Controllers\Gateway\AuthGatewayController;
use App\Http\Controllers\Gateway\CatalogGatewayController;
use App\Http\Controllers\Gateway\OrderGatewayController;
use App\Http\Controllers\Gateway\PaymentGatewayController;
use Illuminate\Support\Facades\Route;

Route::prefix('web-api')->group(function () {
    Route::get('/catalog/{kind}', [CatalogGatewayController::class, 'catalog'])->whereIn('kind', ['products', 'categories', 'brands']);
    Route::get('/product/{id}', [CatalogGatewayController::class, 'product'])->whereUuid('id');
    Route::post('/register', [AuthGatewayController::class, 'register']);
    Route::post('/login', [AuthGatewayController::class, 'login']);
    Route::post('/logout', [AuthGatewayController::class, 'logout']);
    Route::get('/me', [AuthGatewayController::class, 'me']);
    Route::match(['get', 'post'], '/orders', [OrderGatewayController::class, 'orders']);
    Route::get('/orders/{id}', [OrderGatewayController::class, 'order'])->whereUuid('id');
    Route::post('/payments', [PaymentGatewayController::class, 'pay']);
    Route::get('/payments/{id}', [PaymentGatewayController::class, 'payment'])->whereUuid('id');
    Route::post('/admin/products', [CatalogGatewayController::class, 'saveProduct']);
    Route::patch('/admin/orders/{id}/status', [OrderGatewayController::class, 'orderStatus'])->whereUuid('id');
    Route::post('/admin/payments/{id}/confirm', [PaymentGatewayController::class, 'confirmPayment'])->whereUuid('id');
});

Route::get('/{any?}', fn () => view('app'))->where('any', '^(?!web-api|up).*$');
