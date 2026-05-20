<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManuscriptSubmission extends Model
{
    public const STATUSES = [
        'received',
        'reading',
        'accepted',
        'rejected',
        'editing',
        'production',
        'published',
    ];

    public const COLLECTIONS = [
        'litterature-recits',
        'savoirs-societe',
        'jeunesse-transmission',
    ];

    protected $fillable = [
        'author_name',
        'email',
        'phone',
        'title',
        'collection',
        'genre',
        'page_count',
        'manuscript_url',
        'synopsis',
        'author_note',
        'status',
        'admin_notes',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'page_count' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }
}
