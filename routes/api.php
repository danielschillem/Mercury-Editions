<?php

use App\Http\Controllers\AuthorController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\BookReaderController;
use App\Http\Controllers\BookReviewController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ReadingProgressController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\EditorialCollectionController;
use App\Http\Controllers\ManuscriptSubmissionController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

// Catalogue
Route::get('/books', [BookController::class, 'index']);
Route::get('/books/{book}', [BookController::class, 'show']);
Route::get('/books/{book}/reviews', [BookReviewController::class, 'index']);
Route::get('/books/{book}/reader', [BookReaderController::class, 'show']);
Route::get('/books/{book}/reader/{format}', [BookReaderController::class, 'file'])->whereIn('format', ['pdf', 'epub']);

// Auteurs
Route::get('/authors', [AuthorController::class, 'index']);
Route::get('/authors/{author:slug}', [AuthorController::class, 'show']);

// Collections éditoriales
Route::get('/editorial-collections', [EditorialCollectionController::class, 'index']);

// Commandes
Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:10,1');
Route::middleware('auth')->group(function () {
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::patch('/orders/{order}/complete', [OrderController::class, 'complete']);
    Route::patch('/orders/{order}/fail', [OrderController::class, 'fail']);
});

// Paiement Orange Money
Route::post('/payments/orange', [PaymentController::class, 'processOrangeMoney'])->middleware('throttle:10,1');

// Newsletter
Route::post('/newsletter/subscribe', [NewsletterController::class, 'subscribe'])->middleware('throttle:5,1');
Route::post('/newsletter/unsubscribe/{token}', [NewsletterController::class, 'unsubscribe'])->middleware('throttle:10,1');

// Contact
Route::post('/contact', [ContactController::class, 'send'])->middleware('throttle:3,1');

// Soumissions de manuscrits
Route::post('/manuscripts', [ManuscriptSubmissionController::class, 'store'])->middleware('throttle:3,1');

// ── Compte client ──
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/customer/register', [CustomerAuthController::class, 'register']);
    Route::post('/customer/login', [CustomerAuthController::class, 'login']);
    Route::post('/customer/forgot-password', [CustomerAuthController::class, 'forgotPassword']);
    Route::post('/customer/reset-password', [CustomerAuthController::class, 'resetPassword']);
});
Route::get('/customer/me', [CustomerAuthController::class, 'me']);

Route::middleware('auth')->prefix('customer')->group(function () {
    Route::post('/logout', [CustomerAuthController::class, 'logout']);
    Route::put('/profile', [CustomerAuthController::class, 'updateProfile']);
    Route::get('/orders', [CustomerAuthController::class, 'orders']);
    Route::get('/purchases', [CustomerAuthController::class, 'purchases']);
    Route::get('/books/{book}/verify-access', [CustomerAuthController::class, 'verifyBookAccess']);
    Route::get('/cart', [CustomerAuthController::class, 'getCart']);
    Route::put('/cart', [CustomerAuthController::class, 'saveCart']);
    Route::post('/resend-verification', [CustomerAuthController::class, 'resendVerification'])->middleware('throttle:3,60');
    Route::post('/books/{book}/reviews', [BookReviewController::class, 'store']);
    Route::get('/wishlist', [CustomerAuthController::class, 'getWishlist']);
    Route::post('/wishlist/{book}', [CustomerAuthController::class, 'addToWishlist']);
    Route::delete('/wishlist/{book}', [CustomerAuthController::class, 'removeFromWishlist']);
    
    // Progression de lecture
    Route::get('/reading-progress', [ReadingProgressController::class, 'index']);
    Route::get('/reading-progress/last', [ReadingProgressController::class, 'lastReading']);
    Route::get('/books/{book}/progress', [ReadingProgressController::class, 'show']);
    Route::post('/books/{book}/progress', [ReadingProgressController::class, 'update']);
});

// ── Admin API ──
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index']);
    Route::get('/dashboard/stats', [App\Http\Controllers\Admin\DashboardController::class, 'stats']);

    // Livres
    Route::get('/books', [App\Http\Controllers\Admin\BookController::class, 'index']);
    Route::post('/books', [App\Http\Controllers\Admin\BookController::class, 'store']);
    Route::get('/books/{book}', [App\Http\Controllers\Admin\BookController::class, 'show']);
    Route::put('/books/{book}', [App\Http\Controllers\Admin\BookController::class, 'update']);
    Route::delete('/books/{book}', [App\Http\Controllers\Admin\BookController::class, 'destroy']);

    // Auteurs
    Route::get('/authors', [App\Http\Controllers\Admin\AuthorController::class, 'index']);
    Route::post('/authors', [App\Http\Controllers\Admin\AuthorController::class, 'store']);
    Route::get('/authors/{author}', [App\Http\Controllers\Admin\AuthorController::class, 'show']);
    Route::put('/authors/{author}', [App\Http\Controllers\Admin\AuthorController::class, 'update']);
    Route::delete('/authors/{author}', [App\Http\Controllers\Admin\AuthorController::class, 'destroy']);

    // Commandes
    Route::get('/orders', [App\Http\Controllers\Admin\OrderController::class, 'index']);
    Route::get('/orders/{order}', [App\Http\Controllers\Admin\OrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [App\Http\Controllers\Admin\OrderController::class, 'updateStatus']);
    Route::delete('/orders/{order}', [App\Http\Controllers\Admin\OrderController::class, 'destroy']);

    // Utilisateurs
    Route::get('/users', [App\Http\Controllers\Admin\UserController::class, 'index']);
    Route::get('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'show']);
    Route::put('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'update']);
    Route::delete('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'destroy']);

    // Messages de contact
    Route::get('/contacts', [App\Http\Controllers\Admin\ContactMessageController::class, 'index']);
    Route::get('/contacts/{contactMessage}', [App\Http\Controllers\Admin\ContactMessageController::class, 'show']);
    Route::patch('/contacts/{contactMessage}/read', [App\Http\Controllers\Admin\ContactMessageController::class, 'markAsRead']);
    Route::delete('/contacts/{contactMessage}', [App\Http\Controllers\Admin\ContactMessageController::class, 'destroy']);
});
