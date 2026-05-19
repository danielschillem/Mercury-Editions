<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Traits\ResolvesBookReaderAccess;
use App\Models\Book;
use App\Models\ReadingProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReadingProgressController extends Controller
{
    use ResolvesBookReaderAccess;

    /**
     * Récupérer la progression de lecture d'un livre
     */
    public function show(Request $request, Book $book): JsonResponse
    {
        $user = Auth::user();
        
        if (! $user) {
            return response()->json([
                'progress' => null,
                'message' => 'Utilisateur non connecté',
            ]);
        }

        // Vérifier l'accès au livre
        $purchase = $this->findAccessibleEbookPurchase($request, $book);
        
        if (! $purchase) {
            return response()->json([
                'progress' => null,
                'message' => 'Accès non autorisé',
            ], 403);
        }

        $progress = ReadingProgress::where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->first();

        if (! $progress) {
            return response()->json([
                'progress' => null,
                'message' => 'Aucune progression enregistrée',
            ]);
        }

        return response()->json([
            'progress' => [
                'format' => $progress->format,
                'current_page' => $progress->current_page,
                'total_pages' => $progress->total_pages,
                'progress_percent' => round($progress->progress_percent, 1),
                'epub_cfi' => $progress->epub_cfi,
                'epub_chapter' => $progress->epub_chapter,
                'reading_time' => $progress->reading_time_seconds,
                'reading_time_formatted' => $progress->reading_time_formatted,
                'sessions_count' => $progress->sessions_count,
                'last_read_at' => $progress->last_read_at?->toIso8601String(),
                'started_at' => $progress->started_at?->toIso8601String(),
                'finished_at' => $progress->finished_at?->toIso8601String(),
                'is_finished' => $progress->isFinished(),
                'estimated_remaining' => $progress->estimated_time_remaining,
            ],
        ]);
    }

    /**
     * Mettre à jour la progression de lecture
     */
    public function update(Request $request, Book $book): JsonResponse
    {
        $user = Auth::user();
        
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non connecté',
            ], 401);
        }

        // Vérifier l'accès au livre
        $purchase = $this->findAccessibleEbookPurchase($request, $book);
        
        if (! $purchase) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé',
            ], 403);
        }

        $validated = $request->validate([
            'format' => 'required|in:pdf,epub',
            'current_page' => 'required|integer|min:1',
            'total_pages' => 'nullable|integer|min:1',
            'progress_percent' => 'required|numeric|min:0|max:100',
            'epub_cfi' => 'nullable|string|max:500',
            'epub_chapter' => 'nullable|string|max:255',
            'session_duration' => 'nullable|integer|min:0', // Durée de session en secondes
            'is_new_session' => 'boolean',
        ]);

        $progress = ReadingProgress::firstOrNew([
            'user_id' => $user->id,
            'book_id' => $book->id,
        ]);

        // Première lecture
        if (! $progress->exists || ! $progress->started_at) {
            $progress->started_at = now();
            $progress->order_item_id = $purchase->id;
        }

        // Mettre à jour les données de position
        $progress->format = $validated['format'];
        $progress->current_page = $validated['current_page'];
        $progress->total_pages = $validated['total_pages'] ?? $progress->total_pages;
        $progress->progress_percent = $validated['progress_percent'];
        $progress->epub_cfi = $validated['epub_cfi'] ?? $progress->epub_cfi;
        $progress->epub_chapter = $validated['epub_chapter'] ?? $progress->epub_chapter;
        $progress->last_read_at = now();

        // Ajouter le temps de lecture
        if (isset($validated['session_duration']) && $validated['session_duration'] > 0) {
            $progress->reading_time_seconds += $validated['session_duration'];
        }

        // Incrémenter les sessions si c'est une nouvelle session
        if ($request->boolean('is_new_session')) {
            $progress->sessions_count++;
        }

        // Marquer comme terminé si 100%
        if ($validated['progress_percent'] >= 100 && ! $progress->finished_at) {
            $progress->finished_at = now();
        }

        $progress->save();

        return response()->json([
            'success' => true,
            'progress' => [
                'format' => $progress->format,
                'current_page' => $progress->current_page,
                'total_pages' => $progress->total_pages,
                'progress_percent' => round($progress->progress_percent, 1),
                'reading_time_formatted' => $progress->reading_time_formatted,
                'sessions_count' => $progress->sessions_count,
                'is_finished' => $progress->isFinished(),
            ],
        ]);
    }

    /**
     * Récupérer toutes les progressions de lecture de l'utilisateur
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (! $user) {
            return response()->json([
                'reading_list' => [],
            ]);
        }

        $progressList = ReadingProgress::where('user_id', $user->id)
            ->with('book:id,title,author_name,cover_image')
            ->orderByDesc('last_read_at')
            ->get()
            ->map(function (ReadingProgress $progress) {
                return [
                    'book_id' => $progress->book_id,
                    'book' => [
                        'id' => $progress->book->id,
                        'title' => $progress->book->title,
                        'author_name' => $progress->book->author_name,
                        'cover_image' => $progress->book->cover_image,
                    ],
                    'format' => $progress->format,
                    'current_page' => $progress->current_page,
                    'total_pages' => $progress->total_pages,
                    'progress_percent' => round($progress->progress_percent, 1),
                    'reading_time_formatted' => $progress->reading_time_formatted,
                    'sessions_count' => $progress->sessions_count,
                    'last_read_at' => $progress->last_read_at?->toIso8601String(),
                    'is_finished' => $progress->isFinished(),
                ];
            });

        // Séparer les livres en cours et terminés
        $inProgress = $progressList->filter(fn ($p) => ! $p['is_finished'])->values();
        $finished = $progressList->filter(fn ($p) => $p['is_finished'])->values();

        return response()->json([
            'reading_list' => $progressList,
            'in_progress' => $inProgress,
            'finished' => $finished,
            'stats' => [
                'total_reading_time' => ReadingProgress::where('user_id', $user->id)->sum('reading_time_seconds'),
                'books_in_progress' => $inProgress->count(),
                'books_finished' => $finished->count(),
            ],
        ]);
    }

    /**
     * Récupérer le dernier livre en cours de lecture (pour "Reprendre")
     */
    public function lastReading(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (! $user) {
            return response()->json([
                'last_reading' => null,
            ]);
        }

        $progress = ReadingProgress::where('user_id', $user->id)
            ->where('progress_percent', '<', 100)
            ->with('book:id,title,author_name,cover_image')
            ->orderByDesc('last_read_at')
            ->first();

        if (! $progress) {
            return response()->json([
                'last_reading' => null,
            ]);
        }

        return response()->json([
            'last_reading' => [
                'book_id' => $progress->book_id,
                'book' => [
                    'id' => $progress->book->id,
                    'title' => $progress->book->title,
                    'author_name' => $progress->book->author_name,
                    'cover_image' => $progress->book->cover_image,
                ],
                'format' => $progress->format,
                'current_page' => $progress->current_page,
                'total_pages' => $progress->total_pages,
                'progress_percent' => round($progress->progress_percent, 1),
                'last_read_at' => $progress->last_read_at?->toIso8601String(),
            ],
        ]);
    }
}
