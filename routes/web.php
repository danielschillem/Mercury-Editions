<?php

use App\Http\Controllers\Admin;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

// ── Admin Auth (session-based, no middleware) ──
Route::post('/admin/login', [Admin\AuthController::class, 'login'])->middleware('throttle:5,1');

// ── Admin API (protected) ──
Route::middleware(['auth', 'admin'])->prefix('admin/api')->group(function () {
    Route::post('/logout', [Admin\AuthController::class, 'logout']);
    Route::get('/me', [Admin\AuthController::class, 'me']);
    Route::get('/dashboard', [Admin\DashboardController::class, 'index']);
    Route::apiResource('/books', Admin\BookController::class);
    Route::apiResource('/authors', Admin\AuthorController::class);
    Route::get('/orders', [Admin\OrderController::class, 'index']);
    Route::get('/orders/{order}', [Admin\OrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [Admin\OrderController::class, 'updateStatus']);
    Route::get('/users', [Admin\UserController::class, 'index']);
    Route::get('/users/{user}', [Admin\UserController::class, 'show']);
    Route::put('/users/{user}', [Admin\UserController::class, 'update']);
    Route::delete('/users/{user}', [Admin\UserController::class, 'destroy']);
    Route::get('/contact-messages', [Admin\ContactMessageController::class, 'index']);
    Route::patch('/contact-messages/{contactMessage}/status', [Admin\ContactMessageController::class, 'updateStatus']);
});

// ── Email Verification ──
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    return redirect('/?verified=1');
})->middleware(['auth', 'signed'])->name('verification.verify');

// ── Admin SPA ──
Route::get('/admin/{any?}', fn () => view('admin'))->where('any', '.*');

// ── Public SPA (catch-all — must be LAST) ──
Route::get('/{any?}', fn () => view('app'))->where('any', '.*');
