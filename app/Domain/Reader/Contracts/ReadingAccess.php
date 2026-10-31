<?php

declare(strict_types=1);

namespace App\Domain\Reader\Contracts;

use App\Models\Book;
use App\Models\OrderItem;
use App\Models\User;

interface ReadingAccess
{
    /** A connected identity always takes precedence over a legacy guest token. */
    public function purchaseFor(?User $user, Book $book, ?string $legacyGuestToken = null): ?OrderItem;
}
