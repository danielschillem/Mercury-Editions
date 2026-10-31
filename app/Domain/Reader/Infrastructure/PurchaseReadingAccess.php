<?php

declare(strict_types=1);

namespace App\Domain\Reader\Infrastructure;

use App\Domain\Reader\Contracts\ReadingAccess;
use App\Models\Book;
use App\Models\OrderItem;
use App\Models\User;

final class PurchaseReadingAccess implements ReadingAccess
{
    public function purchaseFor(?User $user, Book $book, ?string $legacyGuestToken = null): ?OrderItem
    {
        $query = OrderItem::query()
            ->where('book_id', $book->id)
            ->where('format', 'ebook')
            ->whereHas('order', fn ($order) => $order->where('status', 'completed'));

        if ($user !== null) {
            $query->whereHas('order', fn ($order) => $order->where('user_id', $user->id));
        } elseif (config('reader.legacy_guest_tokens') && trim((string) $legacyGuestToken) !== '') {
            $query->where('access_token', trim($legacyGuestToken));
        } else {
            return null;
        }

        return $query->with('order')->latest('id')->first();
    }
}
