<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class MynaPayGateway
{
    /** @throws ConnectionException */
    public function createOrangeCollection(array $payload, string $idempotencyKey): Response
    {
        return $this->request($idempotencyKey)
            ->post('/api/v1/collections', $payload + ['idempotency_key' => $idempotencyKey]);
    }

    /** @throws ConnectionException */
    public function checkCollection(string $collectionId): Response
    {
        return $this->request()->post('/api/v1/collections/' . rawurlencode($collectionId) . '/check');
    }

    private function request(?string $idempotencyKey = null): \Illuminate\Http\Client\PendingRequest
    {
        $request = Http::baseUrl(rtrim((string) config('mynapay.base_url'), '/'))
            ->withToken((string) config('mynapay.api_key'))
            ->acceptJson()
            ->asJson()
            ->timeout((int) config('mynapay.timeout', 30));

        if ($idempotencyKey !== null) {
            $request = $request->withHeader('Idempotency-Key', $idempotencyKey);
        }

        return $request;
    }
}
