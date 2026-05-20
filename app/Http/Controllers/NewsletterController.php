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

    public function confirmPage(string $token): \Illuminate\Http\Response
    {
        $valid = NewsletterSubscriber::where('token', $token)->whereNull('unsubscribed_at')->exists();
        $csrfToken = csrf_token();
        $postUrl = url("/api/newsletter/unsubscribe/{$token}");

        $html = $valid
            ? <<<HTML
                <p>Cliquez sur le bouton ci-dessous pour confirmer votre désinscription.</p>
                <form method="POST" action="{$postUrl}" id="f">
                  <input type="hidden" name="_token" value="{$csrfToken}">
                  <button type="submit">Confirmer la désinscription</button>
                </form>
                HTML
            : '<p>Ce lien est invalide ou vous êtes déjà désinscrit.</p>';

        return response(<<<HTML
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <title>Désinscription Newsletter — Mercury Éditions</title>
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <style>
                body{font-family:sans-serif;max-width:480px;margin:80px auto;padding:0 1rem;color:#222}
                h1{font-size:1.3rem;margin-bottom:1rem}
                button{background:#c0392b;color:#fff;border:none;padding:.75rem 1.5rem;border-radius:6px;cursor:pointer;font-size:1rem}
                button:hover{background:#a93226}
              </style>
            </head>
            <body>
              <h1>Désinscription Newsletter</h1>
              {$html}
            </body>
            </html>
            HTML, 200, ['Content-Type' => 'text/html']);
    }

    public function unsubscribe(string $token): JsonResponse
    {
        $sub = NewsletterSubscriber::where('token', $token)->first();

        if (! $sub) {
            return response()->json(['message' => 'Lien invalide.'], 404);
        }

        if ($sub->unsubscribed_at) {
            return response()->json(['message' => 'Déjà désinscrit.']);
        }

        $sub->update(['unsubscribed_at' => now()]);

        return response()->json(['message' => 'Vous avez été désinscrit de la newsletter.']);
    }
}
