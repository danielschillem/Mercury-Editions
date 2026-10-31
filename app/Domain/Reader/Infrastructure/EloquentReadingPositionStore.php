<?php

declare(strict_types=1);

namespace App\Domain\Reader\Infrastructure;

use App\Domain\Reader\Contracts\ReadingPositionStore;
use App\Models\Book;
use App\Models\ReadingProgress;
use App\Models\User;

final class EloquentReadingPositionStore implements ReadingPositionStore
{
    public function findFor(User $user, Book $book): ?ReadingProgress
    {
        return ReadingProgress::where('user_id', $user->id)->where('book_id', $book->id)->first();
    }
}
