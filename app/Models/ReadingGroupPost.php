<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingGroupPost extends Model
{
    protected $fillable = ['reading_group_id', 'user_id', 'body', 'is_pinned'];
    protected function casts(): array { return ['is_pinned' => 'boolean']; }
    public function group(): BelongsTo { return $this->belongsTo(ReadingGroup::class, 'reading_group_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
