<?php

declare(strict_types=1);

namespace App\Http\Traits;

trait EscapesLikeWildcards
{
    /**
     * Escape LIKE wildcard characters (% and _) in user input
     * to prevent LIKE injection / wildcard abuse.
     */
    private function escapeLike(string $value): string
    {
        return str_replace(
            ['\\', '%', '_'],
            ['\\\\', '\\%', '\\_'],
            $value,
        );
    }
}
