<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReadingGroup extends Model
{
    protected $fillable = ['owner_id', 'current_book_id', 'name', 'slug', 'description', 'interest', 'visibility', 'membership_policy', 'member_limit', 'is_active'];

    protected function casts(): array
    {
        return ['member_limit' => 'integer', 'is_active' => 'boolean'];
    }

    public function owner(): BelongsTo { return $this->belongsTo(User::class, 'owner_id'); }
    public function currentBook(): BelongsTo { return $this->belongsTo(Book::class, 'current_book_id'); }
    public function memberships(): HasMany { return $this->hasMany(ReadingGroupMember::class); }
    public function posts(): HasMany { return $this->hasMany(ReadingGroupPost::class); }
}
