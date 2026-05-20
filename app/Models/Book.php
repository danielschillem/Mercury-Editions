<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'editorial_collection_id',
        'title',
        'author_name',
        'price',
        'category',
        'rating',
        'local',
        'color',
        'cover_image',
        'ebook_pdf_path',
        'ebook_epub_path',
        'year',
        'publication_date',
        'pages',
        'publisher',
        'editorial_director',
        'language',
        'isbn',
        'tags',
        'description',
        'summary',
        'public_excerpt',
        'quote',
    ];

    protected $appends = ['has_ebook'];

    protected function casts(): array
    {
        return [
            'price'  => 'integer',
            'rating' => 'float',
            'local'  => 'boolean',
            'year'   => 'integer',
            'publication_date' => 'date:Y-m-d',
            'pages'  => 'integer',
            'tags'   => 'array',
        ];
    }

    /**
     * Indique si le livre dispose d'un fichier eBook (PDF ou EPUB).
     */
    protected function hasEbook(): Attribute
    {
        return Attribute::make(
            get: fn () => ! empty($this->ebook_pdf_path) || ! empty($this->ebook_epub_path),
        );
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function editorialCollection(): BelongsTo
    {
        return $this->belongsTo(EditorialCollection::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(BookReview::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    // ============ SCOPES ============

    /**
     * Livres locaux (auteurs burkinabè)
     */
    public function scopeLocal($query)
    {
        return $query->where('local', true);
    }

    /**
     * Filtre par catégorie
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Recherche par titre, auteur ou tags
     */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('author_name', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%")
              ->orWhereJsonContains('tags', $term);
        });
    }

    /**
     * Livres les mieux notés
     */
    public function scopeTopRated($query, float $minRating = 4.5)
    {
        return $query->where('rating', '>=', $minRating)->orderByDesc('rating');
    }

    /**
     * Livres récents (publiés cette année)
     */
    public function scopeRecent($query)
    {
        return $query->where('year', '>=', now()->year - 1)->orderByDesc('year');
    }

    /**
     * Livres avec ebook disponible
     */
    public function scopeWithEbook($query)
    {
        return $query->where(function ($q) {
            $q->whereNotNull('ebook_pdf_path')
              ->orWhereNotNull('ebook_epub_path');
        });
    }

    /**
     * Filtre par fourchette de prix
     */
    public function scopePriceRange($query, ?int $min, ?int $max)
    {
        if ($min !== null) {
            $query->where('price', '>=', $min);
        }
        if ($max !== null) {
            $query->where('price', '<=', $max);
        }
        return $query;
    }

    // ============ HELPERS ============

    /**
     * Vérifie si le livre a un ebook PDF
     */
    public function hasPdf(): bool
    {
        return !empty($this->ebook_pdf_path);
    }

    /**
     * Vérifie si le livre a un ebook EPUB
     */
    public function hasEpub(): bool
    {
        return !empty($this->ebook_epub_path);
    }

    /**
     * Calcule le prix ebook (80% du prix papier)
     */
    public function getEbookPriceAttribute(): int
    {
        return (int) round($this->price * 0.8);
    }

    /**
     * Obtient le nombre de ventes
     */
    public function getSalesCountAttribute(): int
    {
        return $this->orderItems()
            ->whereHas('order', fn($q) => $q->where('status', 'completed'))
            ->count();
    }

    /**
     * Obtient la note moyenne des avis
     */
    public function getAverageRatingAttribute(): float
    {
        return (float) $this->reviews()->avg('rating') ?? $this->rating;
    }
}
