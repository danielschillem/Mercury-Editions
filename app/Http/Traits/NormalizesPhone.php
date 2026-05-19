<?php

declare(strict_types=1);

namespace App\Http\Traits;

trait NormalizesPhone
{
    private function normalizePhone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        if (str_starts_with($digits, '226') && strlen($digits) === 11) {
            return substr($digits, 3);
        }

        if (str_starts_with($digits, '0') && strlen($digits) === 9) {
            return substr($digits, 1);
        }

        return $digits;
    }
}
