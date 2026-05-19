<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Book;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class BookCacheService
{
    private const CACHE_TTL = 3600; // 1 heure
    private const CACHE_PREFIX = 'mercury_books_';

    /**
     * Récupère tous les livres avec cache
     */
    public function getAllBooks(?string $category = null, ?string $search = null): Collection
    {
        // Si recherche, pas de cache (trop de variations)
        if ($search) {
            return $this->fetchBooks($category, $search);
        }

        $cacheKey = self::CACHE_PREFIX . 'all_' . ($category ?? 'all');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($category) {
            return $this->fetchBooks($category, null);
        });
    }

    /**
     * Récupère un livre par ID avec cache
     */
    public function getBook(int $bookId): ?Book
    {
        $cacheKey = self::CACHE_PREFIX . 'single_' . $bookId;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($bookId) {
            $book = Book::with('author')->find($bookId);
            
            if ($book) {
                $book->makeHidden(['ebook_pdf_path', 'ebook_epub_path']);
                
                if (Schema::hasTable('book_reviews')) {
                    $book->load([
                        'reviews' => fn ($q) => $q->where('is_approved', true)
                            ->latest()
                            ->limit(20)
                            ->with('user:id,name'),
                    ]);
                } else {
                    $book->setRelation('reviews', collect());
                }
            }

            return $book;
        });
    }

    /**
     * Récupère les livres les mieux notés avec cache
     */
    public function getTopRatedBooks(int $limit = 10): Collection
    {
        $cacheKey = self::CACHE_PREFIX . 'top_rated_' . $limit;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($limit) {
            return Book::query()
                ->orderByDesc('rating')
                ->limit($limit)
                ->get()
                ->each->makeHidden(['ebook_pdf_path', 'ebook_epub_path']);
        });
    }

    /**
     * Récupère les dernières sorties avec cache
     */
    public function getLatestBooks(int $limit = 10): Collection
    {
        $cacheKey = self::CACHE_PREFIX . 'latest_' . $limit;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($limit) {
            return Book::query()
                ->orderByDesc('year')
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get()
                ->each->makeHidden(['ebook_pdf_path', 'ebook_epub_path']);
        });
    }

    /**
     * Récupère les catégories disponibles avec cache
     */
    public function getCategories(): Collection
    {
        $cacheKey = self::CACHE_PREFIX . 'categories';

        return Cache::remember($cacheKey, self::CACHE_TTL * 24, function () {
            return Book::select('category')
                ->distinct()
                ->pluck('category')
                ->filter()
                ->values();
        });
    }

    /**
     * Invalide le cache pour un livre spécifique
     */
    public function invalidateBook(int $bookId): void
    {
        Cache::forget(self::CACHE_PREFIX . 'single_' . $bookId);
        $this->invalidateListCaches();
    }

    /**
     * Invalide tous les caches de listes
     */
    public function invalidateListCaches(): void
    {
        // Supprime les caches de listes connues
        Cache::forget(self::CACHE_PREFIX . 'all_all');
        Cache::forget(self::CACHE_PREFIX . 'categories');
        
        // Supprime les caches par catégorie
        $categories = ['roman', 'poesie', 'conte', 'essai', 'jeunesse', 'developpement', 'sante', 'spiritualite'];
        foreach ($categories as $cat) {
            Cache::forget(self::CACHE_PREFIX . 'all_' . $cat);
        }

        // Supprime les caches top rated et latest
        for ($i = 5; $i <= 20; $i += 5) {
            Cache::forget(self::CACHE_PREFIX . 'top_rated_' . $i);
            Cache::forget(self::CACHE_PREFIX . 'latest_' . $i);
        }
    }

    /**
     * Invalide tout le cache des livres
     */
    public function invalidateAll(): void
    {
        $this->invalidateListCaches();
        
        // Note: Pour une implémentation complète, utiliser Cache::tags() si Redis est disponible
        // ou implémenter un pattern de flush basé sur le préfixe
    }

    /**
     * Fetch books from database
     */
    private function fetchBooks(?string $category, ?string $search): Collection
    {
        $query = Book::query();

        if ($category) {
            $query->where('category', $category);
        }

        if ($search) {
            $search = trim($search);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if (Schema::hasTable('book_reviews')) {
            $query
                ->withAvg(['reviews as reviews_avg_rating' => fn ($q) => $q->where('is_approved', true)], 'rating')
                ->withCount(['reviews' => fn ($q) => $q->where('is_approved', true)]);
        }

        $books = $query->get();
        $books->each->makeHidden(['ebook_pdf_path', 'ebook_epub_path']);

        if (!Schema::hasTable('book_reviews')) {
            $books->transform(function (Book $book) {
                $book->setAttribute('reviews_avg_rating', null);
                $book->setAttribute('reviews_count', 0);
                return $book;
            });
        }

        return $books;
    }
}
