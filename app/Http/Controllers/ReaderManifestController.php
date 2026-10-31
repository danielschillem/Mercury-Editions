<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Reader\Contracts\ReadingAccess;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Strict foundation endpoint: never delivers an original file or a purchase token. */
final class ReaderManifestController extends Controller
{
    public function __invoke(Request $request, Book $book, ReadingAccess $access): JsonResponse
    {
        abort_unless($request->user() && $access->purchaseFor($request->user(), $book), 403);

        return response()->json([
            'schema_version' => 1,
            'book' => ['id' => $book->id, 'title' => $book->title, 'author_name' => $book->author_name],
            'capabilities' => ['read' => false, 'download_original' => false, 'print' => false, 'share_excerpt' => false],
            'delivery' => ['status' => 'pending_secure_derivatives'],
        ])->header('Cache-Control', 'private, no-store')->header('Referrer-Policy', 'no-referrer');
    }
}
