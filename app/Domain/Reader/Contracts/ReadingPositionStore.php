<?php

declare(strict_types=1);

namespace App\Domain\Reader\Contracts;

use App\Models\Book;
use App\Models\ReadingProgress;
use App\Models\User;

interface ReadingPositionStore
{
    /** Reads only. Call ReadingAccess before returning private state. */
    public function findFor(User $user, Book $book): ?ReadingProgress;
}
