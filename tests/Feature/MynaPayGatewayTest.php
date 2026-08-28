<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MynaPayGatewayTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'mynapay.simulate' => false,
            'mynapay.base_url' => 'https://gateway.example.test',
            'mynapay.api_key' => 'secret-partner-key',
        ]);
    }

    public function test_public_payment_configuration_exposes_flow_without_secrets(): void
    {
        config(['mynapay.environment' => 'sandbox', 'mynapay.simulate' => true]);

        $this->getJson('/api/payments/config')
            ->assertOk()
            ->assertExactJson([
                'provider' => 'MynaPay',
                'environment' => 'sandbox',
                'simulation' => true,
                'operator' => 'orange',
                'flow' => 'collection_otp',
                'operators' => [
                    ['id' => 'orange', 'name' => 'Orange Money', 'flow' => 'otp'],
                    ['id' => 'moov', 'name' => 'Moov Money', 'flow' => 'push'],
                ],
                'status_check' => true,
            ])
            ->assertJsonMissing(['api_key' => 'secret-partner-key']);
    }

    public function test_moov_push_collection_is_sent_without_otp(): void
    {
        Http::fake([
            'gateway.example.test/api/v1/collections' => Http::response([
                'collection_id' => 'a1dba5a8-e122-4bbf-a677-7b9fc9fdd500',
                'operator_ref' => 'MOOV-COL-42',
                'status' => 'success',
            ], 202),
        ]);

        $this->postJson('/api/payments/mobile', [
            'operator' => 'moov', 'phone' => '70123456', 'amount' => 2500,
            'refNumber' => 'ORDER-MOOV-0001', 'extTxnId' => 'ORDER-MOOV-0001',
        ])->assertOk()
            ->assertJsonPath('operator', 'moov')
            ->assertJsonPath('transId', 'MOOV-COL-42');

        Http::assertSent(fn (Request $request): bool => $request['operator'] === 'moov'
            && $request['payer_phone'] === '22670123456'
            && ! isset($request['otp']));
    }

    public function test_orange_collection_is_sent_to_mynapay_with_backend_credentials_and_idempotency(): void
    {
        Http::fake([
            'gateway.example.test/api/v1/collections' => Http::response([
                'collection_id' => '91dba5a8-e122-4bbf-a677-7b9fc9fdd568',
                'operator_ref' => 'OM-COL-123456',
                'status' => 'success',
                'message' => 'SUCCESS',
            ], 202),
        ]);

        $this->postJson('/api/payments/orange', [
            'phone' => '70123456', 'amount' => 2500, 'otp' => '541847',
            'refNumber' => 'ORDER-2026-0001', 'extTxnId' => 'ORDER-2026-0001',
        ])->assertOk()->assertJsonPath('status', 'success')->assertJsonPath('transId', 'OM-COL-123456');

        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'https://gateway.example.test/api/v1/collections'
                && $request->hasHeader('Authorization', 'Bearer secret-partner-key')
                && $request->hasHeader('Idempotency-Key', 'ORDER-2026-0001')
                && $request['external_reference'] === 'ORDER-2026-0001'
                && $request['operator'] === 'orange'
                && $request['payer_phone'] === '22670123456'
                && $request['amount'] === 2500
                && $request['otp'] === '541847';
        });
    }

    public function test_pending_collection_can_be_checked_until_success(): void
    {
        $id = '91dba5a8-e122-4bbf-a677-7b9fc9fdd568';
        Http::fake([
            'gateway.example.test/api/v1/collections' => Http::response([
                'collection_id' => $id, 'status' => 'pending', 'message' => 'En attente',
            ], 202),
            "gateway.example.test/api/v1/collections/{$id}/check" => Http::response([
                'collection_id' => $id, 'operator_ref' => 'OM-FINAL-42',
                'status' => 'success', 'message' => 'Confirmé',
            ]),
        ]);

        $payload = [
            'phone' => '70123456', 'amount' => 2500, 'otp' => '541847',
            'refNumber' => 'ORDER-2026-0002', 'extTxnId' => 'ORDER-2026-0002',
        ];
        $this->postJson('/api/payments/orange', $payload)
            ->assertAccepted()->assertJsonPath('status', 'pending')->assertJsonPath('collectionId', $id);

        $this->postJson("/api/payments/orange/{$id}/check", [
            'refNumber' => $payload['refNumber'], 'extTxnId' => $payload['extTxnId'],
        ])->assertOk()->assertJsonPath('status', 'success')->assertJsonPath('transId', 'OM-FINAL-42');
    }
}
