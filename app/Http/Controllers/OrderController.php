<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use App\Http\Traits\NormalizesPhone;

class OrderController extends Controller
{
    use NormalizesPhone;

    private function authorizeOrderOwnership(Request $request, Order $order): ?JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Authentification requise.'], 401);
        }

        if ($user->is_admin) {
            return null;
        }

        if ($order->user_id === null) {
            return response()->json([
                'message' => 'Cette commande invitée ne peut pas être modifiée depuis un compte client.',
            ], 403);
        }

        if ($order->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        return null;
    }

    private function hideSensitiveOrderFields(Order $order): void
    {
        $order->items->each(function (OrderItem $item): void {
            $item->makeHidden(['access_token']);
        });
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'buyer_phone' => $this->normalizePhone($request->input('buyer_phone')),
        ]);

        $validated = $request->validate([
            'buyer_phone' => ['required', 'regex:/^\d{8}$/'],
            'buyer_name'  => ['nullable', 'string', 'max:100'],
            'buyer_email' => ['nullable', 'email', 'max:100'],
            'shipping_address' => ['nullable', 'string', 'max:255'],
            'shipping_city'    => ['nullable', 'string', 'max:100'],
            'delivery_notes'   => ['nullable', 'string', 'max:500'],
            'items'       => ['required', 'array', 'min:1'],
            'items.*.book_id' => ['required', 'integer', 'exists:books,id'],
            'items.*.format'  => ['required', 'in:ebook,physical'],
        ]);

        $items = collect($validated['items'])->map(function (array $item) {
            $book = Book::findOrFail($item['book_id']);
            $price = $item['format'] === 'physical'
                ? (int) round($book->price * 1.6)
                : $book->price;

            return [
                'book_id'    => $book->id,
                'format'     => $item['format'],
                'unit_price' => $price,
            ];
        });

        $subtotal = $items->sum('unit_price');
        $omFees = (int) round($subtotal * 0.01);

        $order = Order::create([
            'reference'        => 'MRC-' . now()->format('ymd') . '-' . strtoupper(Str::random(6)),
            'user_id'          => $request->user()?->id,
            'buyer_phone'      => $validated['buyer_phone'],
            'buyer_name'       => $validated['buyer_name'] ?? null,
            'buyer_email'      => $validated['buyer_email'] ?? null,
            'shipping_address' => $validated['shipping_address'] ?? null,
            'shipping_city'    => $validated['shipping_city'] ?? null,
            'delivery_notes'   => $validated['delivery_notes'] ?? null,
            'total_amount'     => $subtotal + $omFees,
            'om_fees'          => $omFees,
            'status'           => 'pending',
        ]);

        foreach ($items as $item) {
            $accessToken = $item['format'] === 'ebook' ? Str::random(48) : null;
            $order->items()->create(array_merge($item, ['access_token' => $accessToken]));
        }

        $order->load('items.book');

        return response()->json($order, 201);
    }

    public function complete(Request $request, Order $order): JsonResponse
    {
        $ownershipError = $this->authorizeOrderOwnership($request, $order);
        if ($ownershipError) {
            return $ownershipError;
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Cette commande ne peut pas être modifiée.'], 422);
        }

        $validated = $request->validate([
            'om_transaction_id' => ['required', 'string', 'max:60'],
            'ext_txn_id' => ['required', 'string', 'max:50'],
            'ref_number' => ['required', 'string', 'max:50'],
        ]);

        if ($validated['ref_number'] !== $order->reference) {
            return response()->json([
                'message' => 'Référence de commande invalide.',
            ], 422);
        }

        $paymentProof = Cache::get('om_payment_confirmation:' . $validated['ext_txn_id']);
        if (! is_array($paymentProof)) {
            return response()->json([
                'message' => 'Confirmation de paiement introuvable ou expirée.',
            ], 422);
        }

        $isMatchingProof = ($paymentProof['trans_id'] ?? null) === $validated['om_transaction_id']
            && ($paymentProof['reference_number'] ?? null) === $order->reference
            && ((int) ($paymentProof['amount'] ?? -1)) === (int) $order->total_amount;

        if (! $isMatchingProof) {
            return response()->json([
                'message' => 'Les informations de paiement ne correspondent pas à cette commande.',
            ], 422);
        }

        $order->update([
            'status'            => 'completed',
            'om_transaction_id' => $validated['om_transaction_id'],
        ]);

        Cache::forget('om_payment_confirmation:' . $validated['ext_txn_id']);

        $order->load('items.book');

        return response()->json($order);
    }

    public function fail(Request $request, Order $order): JsonResponse
    {
        $ownershipError = $this->authorizeOrderOwnership($request, $order);
        if ($ownershipError) {
            return $ownershipError;
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Cette commande ne peut pas être modifiée.'], 422);
        }

        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:255'],
        ]);

        $order->update([
            'status' => 'failed',
        ]);

        $order->load('items.book');

        return response()->json([
            'order' => $order,
            'message' => $validated['message'] ?? 'Paiement échoué.',
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $ownershipError = $this->authorizeOrderOwnership($request, $order);
        if ($ownershipError) {
            return $ownershipError;
        }

        $order->load('items.book');
        $this->hideSensitiveOrderFields($order);

        return response()->json($order);
    }

}
