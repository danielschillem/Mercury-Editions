<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Author extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'icon',
        'origin',
        'born',
        'died',
        'color',
        'genres',
        'bio',
        'timeline',
        'awards',
    ];

    protected function casts(): array
    {
        return [
            'genres'   => 'array',
            'timeline' => 'array',
            'awards'   => 'array',
        ];
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }
}
