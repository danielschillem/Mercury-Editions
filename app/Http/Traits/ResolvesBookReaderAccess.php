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
        $authHeader = (string) $request->header('Authorization', '');
        $token = str_starts_with($authHeader, 'Bearer ')
            ? trim(substr($authHeader, 7))
            : (config('reader.legacy_query_tokens') ? trim((string) $request->query('token', '')) : '');

        return app(\App\Domain\Reader\Contracts\ReadingAccess::class)
            ->purchaseFor($request->user(), $book, $token);
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
