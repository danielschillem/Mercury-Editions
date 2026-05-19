<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingProgress extends Model
{
    protected $table = 'reading_progress';

    protected $fillable = [
        'user_id',
        'book_id',
        'order_item_id',
        'format',
        'current_page',
        'total_pages',
        'progress_percent',
        'epub_cfi',
        'epub_chapter',
        'reading_time_seconds',
        'sessions_count',
        'last_read_at',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'current_page' => 'integer',
            'total_pages' => 'integer',
            'progress_percent' => 'float',
            'reading_time_seconds' => 'integer',
            'sessions_count' => 'integer',
            'last_read_at' => 'datetime',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    /**
     * Formater le temps de lecture en format lisible
     */
    public function getReadingTimeFormattedAttribute(): string
    {
        $seconds = $this->reading_time_seconds;
        
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        
        $minutes = floor($seconds / 60);
        
        if ($minutes < 60) {
            return "{$minutes}min";
        }
        
        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        
        return "{$hours}h {$remainingMinutes}min";
    }

    /**
     * Vérifier si la lecture est terminée
     */
    public function isFinished(): bool
    {
        return $this->progress_percent >= 100 || $this->finished_at !== null;
    }

    /**
     * Estimer le temps restant basé sur la vitesse de lecture
     */
    public function getEstimatedTimeRemainingAttribute(): ?int
    {
        if ($this->progress_percent <= 0 || $this->reading_time_seconds <= 0) {
            return null;
        }

        $percentRemaining = 100 - $this->progress_percent;
        $timePerPercent = $this->reading_time_seconds / $this->progress_percent;
        
        return (int) round($timePerPercent * $percentRemaining);
    }
}
