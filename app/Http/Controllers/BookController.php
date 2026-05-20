<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class BookController extends Controller
{
    private const PUBLIC_PUBLISHER = 'Mercury Editions';

    public function index(Request $request): JsonResponse
    {
        $query = Book::query()
            ->with('editorialCollection:id,name,slug,color')
            ->where('publisher', self::PUBLIC_PUBLISHER)
            ->orderByDesc('year')
            ->orderByDesc('id');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('summary', 'like', "%{$search}%")
                  ->orWhere('quote', 'like', "%{$search}%")
                  ->orWhere('publisher', 'like', "%{$search}%")
                  ->orWhere('language', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhereRaw(
                      DB::connection()->getDriverName() === 'sqlite'
                          ? "json_extract(tags, '$') like ?"
                          : 'CAST(tags AS CHAR) like ?',
                      ["%{$search}%"]
                  );
            });
        }

        if (Schema::hasTable('book_reviews')) {
            $query
                ->withAvg(['reviews as reviews_avg_rating' => fn ($reviewQuery) => $reviewQuery->where('is_approved', true)], 'rating')
                ->withCount(['reviews' => fn ($reviewQuery) => $reviewQuery->where('is_approved', true)]);
        }

        $books = $query->get();
        $books->each->makeHidden(['ebook_pdf_path', 'ebook_epub_path']);

        if (! Schema::hasTable('book_reviews')) {
            $books->transform(function (Book $book) {
                $book->setAttribute('reviews_avg_rating', null);
                $book->setAttribute('reviews_count', 0);

                return $book;
            });
        }

        return response()->json($books);
    }

    public function show(Book $book): JsonResponse
    {
        if ($book->publisher !== self::PUBLIC_PUBLISHER) {
            abort(404);
        }

        $book->load(['author', 'editorialCollection:id,name,slug,color']);
        $book->makeHidden(['ebook_pdf_path', 'ebook_epub_path']);

        if (Schema::hasTable('book_reviews')) {
            $book->load([
                'reviews' => fn ($q) => $q->where('is_approved', true)->latest()->limit(20)->with('user:id,name'),
            ]);
        } else {
            $book->setRelation('reviews', collect());
        }

        return response()->json($book);
    }
}
