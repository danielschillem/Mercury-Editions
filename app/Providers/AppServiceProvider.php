<?php

namespace App\Providers;

use App\Models\Book;
use App\Observers\BookObserver;
use App\Services\BookCacheService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Vite;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Singleton pour le service de cache des livres
        $this->app->singleton(BookCacheService::class, function ($app) {
            return new BookCacheService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('local')) {
            Vite::useHotFile(storage_path('framework/vite.hot.disabled'));
        }

        // Observer pour invalider le cache quand les livres sont modifiés
        Book::observe(BookObserver::class);
    }
}
