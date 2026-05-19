<?php

declare(strict_types=1);

namespace App\Http\Traits;

use App\Models\Book;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

trait ResolvesBookReaderAccess
{
    private function findAccessibleEbookPurchase(Request $request, Book $book): ?OrderItem
    {
        $token = trim((string) $request->query('token', ''));

        if ($token !== '') {
            $tokenPurchase = OrderItem::query()
                ->where('book_id', $book->id)
                ->where('format', 'ebook')
                ->where('access_token', $token)
                ->whereHas('order', fn ($query) => $query->where('status', 'completed'))
                ->with('order')
                ->latest('id')
                ->first();

            if ($tokenPurchase) {
                return $tokenPurchase;
            }
        }

        $user = $request->user();

        if (! $user) {
            return null;
        }

        return OrderItem::query()
            ->where('book_id', $book->id)
            ->where('format', 'ebook')
            ->whereHas('order', fn ($query) => $query
                ->where('user_id', $user->id)
                ->where('status', 'completed'))
            ->with('order')
            ->latest('id')
            ->first();
    }

    private function resolveStoredAsset(?string $storedPath): ?array
    {
        $storedPath = trim((string) $storedPath);

        if ($storedPath === '') {
            return null;
        }

        if (str_starts_with($storedPath, 'private://')) {
            return [
                'disk' => 'local',
                'path' => substr($storedPath, strlen('private://')),
            ];
        }

        if (str_starts_with($storedPath, 'public://')) {
            return [
                'disk' => 'public',
                'path' => substr($storedPath, strlen('public://')),
            ];
        }

        if (preg_match('/^https?:\/\//i', $storedPath) === 1) {
            $storedPath = (string) parse_url($storedPath, PHP_URL_PATH);
        }

        if (str_starts_with($storedPath, '/storage/')) {
            return [
                'disk' => 'public',
                'path' => ltrim(substr($storedPath, strlen('/storage/')), '/'),
            ];
        }

        if (str_starts_with($storedPath, 'storage/')) {
            return [
                'disk' => 'public',
                'path' => ltrim(substr($storedPath, strlen('storage/')), '/'),
            ];
        }

        return [
            'disk' => 'local',
            'path' => ltrim($storedPath, '/'),
        ];
    }

    private function resolveBookAsset(Book $book, string $format): ?array
    {
        $storedPath = $format === 'epub'
            ? $book->ebook_epub_path
            : $book->ebook_pdf_path;

        $asset = $this->resolveStoredAsset($storedPath);

        if (! $asset || ! Storage::disk($asset['disk'])->exists($asset['path'])) {
            return null;
        }

        return [
            ...$asset,
            'format' => $format,
            'filename' => basename($asset['path']),
            'mime' => $format === 'pdf' ? 'application/pdf' : 'application/epub+zip',
        ];
    }
}
