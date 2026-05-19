<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'reference',
        'user_id',
        'buyer_phone',
        'buyer_name',
        'buyer_email',
        'shipping_address',
        'shipping_city',
        'shipping_country',
        'delivery_notes',
        'total_amount',
        'om_fees',
        'status',
        'om_transaction_id',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'total_amount' => 'integer',
            'om_fees'      => 'integer',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // ============ SCOPES ============

    /**
     * Commandes en attente
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Commandes complétées
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Commandes échouées
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Commandes récentes (30 derniers jours)
     */
    public function scopeRecent($query)
    {
        return $query->where('created_at', '>=', now()->subDays(30));
    }

    /**
     * Recherche par référence, téléphone ou email
     */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('reference', 'like', "%{$term}%")
              ->orWhere('buyer_phone', 'like', "%{$term}%")
              ->orWhere('buyer_email', 'like', "%{$term}%")
              ->orWhere('buyer_name', 'like', "%{$term}%");
        });
    }

    /**
     * Filtre par date
     */
    public function scopeDateRange($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->where('created_at', '>=', $from);
        }
        if ($to) {
            $query->where('created_at', '<=', $to);
        }
        return $query;
    }

    // ============ HELPERS ============

    /**
     * Vérifie si la commande est complétée
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Vérifie si la commande est en attente
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Vérifie si la commande peut être annulée (30 min max)
     */
    public function canBeCancelled(): bool
    {
        return $this->isPending() && $this->created_at->diffInMinutes(now()) <= 30;
    }

    /**
     * Génère une référence unique
     */
    public static function generateReference(): string
    {
        do {
            $reference = 'MRC-' . strtoupper(substr(md5(uniqid()), 0, 8));
        } while (self::where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * Calcule le total avec frais
     */
    public function getTotalWithFeesAttribute(): int
    {
        return $this->total_amount + ($this->om_fees ?? 0);
    }
}
