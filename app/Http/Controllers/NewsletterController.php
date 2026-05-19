<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:100'],
        ]);

        $existing = NewsletterSubscriber::where('email', $validated['email'])->first();

        if ($existing && ! $existing->unsubscribed_at) {
            return response()->json(['message' => 'Vous êtes déjà inscrit à notre newsletter.']);
        }

        if ($existing) {
            $existing->update(['unsubscribed_at' => null, 'subscribed_at' => now()]);
        } else {
            NewsletterSubscriber::create([
                'email'         => $validated['email'],
                'token'         => Str::random(64),
                'subscribed_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Inscription confirmée ! Merci.'], 201);
    }

    public function unsubscribe(string $token): JsonResponse
    {
        $sub = NewsletterSubscriber::where('token', $token)->first();

        if (! $sub) {
            return response()->json(['message' => 'Lien invalide.'], 404);
        }

        $sub->update(['unsubscribed_at' => now()]);

        return response()->json(['message' => 'Vous avez été désinscrit de la newsletter.']);
    }
}
