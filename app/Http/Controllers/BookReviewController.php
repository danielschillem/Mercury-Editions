<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class BookReviewController extends Controller
{
    public function index(Book $book): JsonResponse
    {
        if (! Schema::hasTable('book_reviews')) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                    'average' => 0,
                ],
            ]);
        }

        $reviews = $book->reviews()
            ->where('is_approved', true)
            ->with('user:id,name')
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'total' => $reviews->total(),
                'average' => round((float) $book->reviews()->where('is_approved', true)->avg('rating'), 2),
            ],
        ]);
    }

    public function store(Request $request, Book $book): JsonResponse
    {
        if (! Schema::hasTable('book_reviews')) {
            return response()->json(['message' => 'Les avis ne sont pas encore disponibles sur cette instance.'], 503);
        }

        $user = $request->user();

        $hasPurchased = $book->orderItems()
            ->whereHas('order', fn ($q) => $q->where('user_id', $user->id)->where('status', 'completed'))
            ->exists();

        if (! $hasPurchased) {
            return response()->json(['message' => 'Seuls les lecteurs ayant acheté ce livre peuvent publier un avis.'], 403);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:120'],
            'comment' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $review = BookReview::updateOrCreate(
            ['book_id' => $book->id, 'user_id' => $user->id],
            [
                'rating' => $validated['rating'],
                'title' => $validated['title'] ?? null,
                'comment' => $validated['comment'],
                'is_approved' => true,
            ]
        );

        $review->load('user:id,name');

        return response()->json([
            'message' => 'Votre avis a été enregistré.',
            'review' => $review,
            'average' => round((float) $book->reviews()->where('is_approved', true)->avg('rating'), 2),
        ], 201);
    }
}
