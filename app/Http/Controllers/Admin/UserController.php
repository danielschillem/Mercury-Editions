<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('is_admin', $request->input('role') === 'admin');
        }

        $users = $query->withCount('orders')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        $user->loadCount('orders');
        $totalSpent = $user->orders()->where('status', 'completed')->sum('total_amount');

        return response()->json([
            'user' => $user,
            'total_spent' => (int) $totalSpent,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['sometimes', 'string', 'max:100'],
            'email'    => ['sometimes', 'email', 'max:100', 'unique:users,email,' . $user->id],
            'phone'    => ['nullable', 'regex:/^\d{8}$/', 'unique:users,phone,' . $user->id],
            'is_admin' => ['sometimes', 'boolean'],
        ]);

        if (
            array_key_exists('is_admin', $validated)
            && $user->id === (int) $request->user()->id
            && $validated['is_admin'] === false
        ) {
            return response()->json([
                'message' => 'Impossible de retirer vos propres droits administrateur.',
            ], 422);
        }

        $user->update($validated);

        return response()->json($user);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Impossible de supprimer votre propre compte.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}
