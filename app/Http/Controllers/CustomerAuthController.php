<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use App\Http\Traits\NormalizesPhone;
use App\Http\Traits\ResolvesBookReaderAccess;

class CustomerAuthController extends Controller
{
    use NormalizesPhone;
    use ResolvesBookReaderAccess;
    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'phone' => $this->normalizePhone($request->input('phone')),
        ]);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:100', 'unique:users,email'],
            'phone'    => ['required', 'regex:/^\d{8}$/', 'unique:users,phone'],
            'password' => ['required', 'string', Password::min(6)],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'phone'    => $validated['phone'],
            'password' => $validated['password'],
            'is_admin' => false,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        if ($this->shouldSendVerificationEmail()) {
            try {
                $user->sendEmailVerificationNotification();
            } catch (\Throwable $exception) {
                Log::warning('Email verification could not be sent after registration.', [
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'email_verified' => false,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->where('is_admin', false)->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'email_verified' => $user->hasVerifiedEmail(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Déconnecté.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->is_admin) {
            return response()->json(['user' => null]);
        }

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'email_verified' => $user->hasVerifiedEmail(),
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->merge([
            'phone' => $this->normalizePhone($request->input('phone')),
        ]);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', 'unique:users,email,' . $user->id],
            'phone' => ['required', 'regex:/^\d{8}$/', 'unique:users,phone,' . $user->id],
        ]);

        $user->update($validated);

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'email_verified' => $user->hasVerifiedEmail(),
            ],
        ]);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email d\u00e9j\u00e0 v\u00e9rifi\u00e9.']);
        }

        if ($this->shouldSendVerificationEmail()) {
            try {
                $user->sendEmailVerificationNotification();
            } catch (\Throwable $exception) {
                Log::warning('Email verification resend failed.', [
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        return response()->json(['message' => 'Email de v\u00e9rification renvoy\u00e9.']);
    }

    public function orders(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('items.book')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    public function purchases(Request $request): JsonResponse
    {
        $items = \App\Models\OrderItem::query()
            ->whereHas('order', fn ($q) => $q->where('user_id', $request->user()->id)->where('status', 'completed'))
            ->with('book', 'order')
            ->get()
            ->map(fn ($item) => [
                'bookId'       => $item->book_id,
                'format'       => $item->format,
                'accessToken'  => $item->access_token ?? '',
                'txnId'        => $item->order->om_transaction_id ?? '',
                'buyerPhone'   => $item->order->buyer_phone,
                'purchaseDate' => $item->order->created_at->toIso8601String(),
                'readSessions' => 0,
            ]);

        return response()->json($items);
    }

    public function verifyBookAccess(Request $request, \App\Models\Book $book): JsonResponse
    {
        $hasAccess = $this->findAccessibleEbookPurchase($request, $book) !== null;

        return response()->json(['access' => $hasAccess]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->input('email'))->where('is_admin', false)->first();

        if (! $user) {
            // Return success even if user not found (avoid email enumeration)
            return response()->json(['message' => 'Si ce compte existe, un code de réinitialisation a été généré.']);
        }

        // Generate a 6-digit code stored in password_reset_tokens
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($code), 'created_at' => now()],
        );

        // In production, send email/SMS with $code
        // For now, return it in dev mode only
        $response = ['message' => 'Si ce compte existe, un code de réinitialisation a été généré.'];
        if (app()->environment('local')) {
            $response['debug_code'] = $code;
        }

        return response()->json($response);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'code'     => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', Password::min(6)],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record || ! Hash::check($validated['code'], $record->token)) {
            return response()->json(['message' => 'Code invalide ou expiré.'], 422);
        }

        // Code expires after 30 minutes
        if (now()->diffInMinutes($record->created_at) > 30) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            return response()->json(['message' => 'Code expiré. Veuillez en demander un nouveau.'], 422);
        }

        $user = User::where('email', $validated['email'])->where('is_admin', false)->first();
        if (! $user) {
            return response()->json(['message' => 'Compte introuvable.'], 404);
        }

        $user->update(['password' => $validated['password']]);
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès.',
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ]);
    }

    public function getCart(Request $request): JsonResponse
    {
        return response()->json($request->user()->cart_data ?? []);
    }

    public function saveCart(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cart' => ['required', 'array', 'max:50'],
            'cart.*.id' => ['required', 'integer'],
            'cart.*.format' => ['required', 'string', 'in:ebook,physical'],
            'cart.*.finalPrice' => ['required', 'numeric', 'min:0'],
            'cart.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $request->user()->update(['cart_data' => $validated['cart']]);

        return response()->json(['message' => 'Panier synchronisé.']);
    }

    private function shouldSendVerificationEmail(): bool
    {
        return ! app()->environment('local');
    }

    public function getWishlist(Request $request): JsonResponse
    {
        $bookIds = $request->user()->wishlists()->pluck('book_id');
        return response()->json($bookIds);
    }

    public function addToWishlist(Request $request, \App\Models\Book $book): JsonResponse
    {
        $user = $request->user();
        $exists = $user->wishlists()->where('book_id', $book->id)->exists();

        if ($exists) {
            return response()->json(['message' => 'Déjà dans vos favoris.']);
        }

        $user->wishlists()->create(['book_id' => $book->id]);

        return response()->json(['message' => 'Ajouté aux favoris.'], 201);
    }

    public function removeFromWishlist(Request $request, \App\Models\Book $book): JsonResponse
    {
        $request->user()->wishlists()->where('book_id', $book->id)->delete();

        return response()->json(['message' => 'Retiré des favoris.']);
    }
}
