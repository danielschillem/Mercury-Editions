<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! $request->user()->is_admin) {
            if ($request->expectsJson() || $request->is('admin/api/*')) {
                return response()->json(['message' => 'Accès non autorisé.'], 403);
            }

            return redirect('/admin');
        }

        return $next($request);
    }
}
