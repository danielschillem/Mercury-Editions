<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Author;
use Illuminate\Http\JsonResponse;

class AuthorController extends Controller
{
    private const PUBLIC_PUBLISHER = 'Mercury Editions';

    public function index(): JsonResponse
    {
        $authors = Author::query()
            ->whereHas('books', fn ($bookQuery) => $bookQuery->where('publisher', self::PUBLIC_PUBLISHER)->published())
            ->withCount([
                'books' => fn ($bookQuery) => $bookQuery->where('publisher', self::PUBLIC_PUBLISHER)->published(),
            ])
            ->get();

        return response()->json($authors);
    }

    public function show(Author $author): JsonResponse
    {
        if (! $author->books()->where('publisher', self::PUBLIC_PUBLISHER)->published()->exists()) {
            abort(404);
        }

        $author->loadCount([
            'books' => fn ($bookQuery) => $bookQuery->where('publisher', self::PUBLIC_PUBLISHER)->published(),
        ]);

        return response()->json($author);
    }
}
