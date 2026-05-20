<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Traits\ResolvesBookReaderAccess;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookReaderController extends Controller
{
    use ResolvesBookReaderAccess;

    public function show(Request $request, Book $book): JsonResponse
    {
        $purchase = $this->findAccessibleEbookPurchase($request, $book);

        if (! $purchase) {
            return response()->json([
                'access' => false,
                'message' => 'Aucune licence eBook valide trouvée pour cet ouvrage.',
            ], 403);
        }

        $pdf = $this->resolveBookAsset($book, 'pdf');
        $epub = $this->resolveBookAsset($book, 'epub');

        return response()->json([
            'access' => true,
            'book' => [
                'id' => $book->id,
                'title' => $book->title,
                'author_name' => $book->author_name,
            ],
            'reader' => [
                'available_formats' => [
                    'pdf' => $pdf !== null,
                    'epub' => $epub !== null,
                ],
                'preferred_format' => $pdf !== null ? 'pdf' : ($epub !== null ? 'epub' : null),
                'fallback_excerpt' => $pdf === null && $epub === null,
            ],
            'purchase' => [
                'access_token' => $purchase->access_token,
                'buyer_phone' => $purchase->order?->buyer_phone,
                'transaction_id' => $purchase->order?->om_transaction_id,
            ],
        ]);
    }

    public function file(Request $request, Book $book, string $format): StreamedResponse|JsonResponse
    {
        if (! in_array($format, ['pdf', 'epub'], true)) {
            abort(404);
        }

        $purchase = $this->findAccessibleEbookPurchase($request, $book);

        if (! $purchase) {
            return response()->json([
                'message' => 'Accès non autorisé à ce fichier eBook.',
            ], 403);
        }

        $asset = $this->resolveBookAsset($book, $format);

        if (! $asset) {
            return response()->json([
                'message' => 'Fichier eBook indisponible pour ce format.',
            ], 404);
        }

        return Storage::disk($asset['disk'])->response(
            $asset['path'],
            $asset['filename'],
            [
                'Content-Type' => $asset['mime'],
                'Cache-Control' => 'private, max-age=0, must-revalidate',
                'Pragma' => 'no-cache',
                'X-Robots-Tag' => 'noindex, nofollow',
                'Referrer-Policy' => 'no-referrer',
            ],
            'inline',
        );
    }
}
