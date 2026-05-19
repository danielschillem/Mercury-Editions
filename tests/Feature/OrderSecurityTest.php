<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function createBook(string $suffix): Book
    {
        return Book::create([
            'title' => "Livre sécurité {$suffix}",
            'author_name' => 'Auteur Test',
            'price' => 3500,
            'category' => 'roman',
            'rating' => 4.5,
            'local' => true,
            'color' => '#1a1a2e',
            'year' => 2026,
            'pages' => 200,
            'publisher' => 'Mercury Editions',
            'language' => 'Français',
            'isbn' => '978-2-35926-' . str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT) . '-' . $suffix,
            'tags' => ['test', 'security'],
            'description' => 'Description de test sécurité.',
            'summary' => 'Résumé de test sécurité.',
            'quote' => 'Citation de test sécurité.',
        ]);
    }

    private function createOrder(?User $owner, string $token = 'TOKEN-SECURE-001'): Order
    {
        $book = $this->createBook(Str::upper(Str::random(4)));

        $order = Order::create([
            'reference' => 'MRC-SEC-' . Str::upper(Str::random(8)),
            'user_id' => $owner?->id,
            'buyer_phone' => '70123456',
            'buyer_name' => 'Client Test',
            'buyer_email' => 'client@example.test',
            'total_amount' => 3500,
            'om_fees' => 35,
            'status' => 'pending',
        ]);

        $order->items()->create([
            'book_id' => $book->id,
            'format' => 'ebook',
            'unit_price' => 3500,
            'access_token' => $token,
        ]);

        return $order->fresh();
    }

    public function test_guest_cannot_view_order_details(): void
    {
        $user = User::factory()->create(['phone' => '70123456']);
        $order = $this->createOrder($user);

        $this->getJson("/api/orders/{$order->id}")
            ->assertUnauthorized();
    }

    public function test_owner_can_view_order_without_exposing_access_token(): void
    {
        $owner = User::factory()->create(['phone' => '70123456']);
        $order = $this->createOrder($owner, 'TOKEN-PRIVATE-123');

        $this->actingAs($owner)
            ->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('id', $order->id)
            ->assertJsonMissingPath('items.0.access_token');
    }

    public function test_customer_cannot_view_another_customer_order(): void
    {
        $owner = User::factory()->create(['phone' => '70123456']);
        $intruder = User::factory()->create(['phone' => '76123456']);
        $order = $this->createOrder($owner);

        $this->actingAs($intruder)
            ->getJson("/api/orders/{$order->id}")
            ->assertForbidden();
    }

    public function test_customer_cannot_complete_another_customer_order(): void
    {
        $owner = User::factory()->create(['phone' => '70123456']);
        $intruder = User::factory()->create(['phone' => '76123456']);
        $order = $this->createOrder($owner);

        $this->actingAs($intruder)
            ->patchJson("/api/orders/{$order->id}/complete", [
                'om_transaction_id' => 'OM-ATTACK-001',
            ])
            ->assertForbidden();
    }

    public function test_customer_cannot_complete_guest_order(): void
    {
        $customer = User::factory()->create(['phone' => '70123456']);
        $guestOrder = $this->createOrder(null);

        $this->actingAs($customer)
            ->patchJson("/api/orders/{$guestOrder->id}/complete", [
                'om_transaction_id' => 'OM-GUEST-001',
            ])
            ->assertForbidden();
    }

    public function test_owner_cannot_complete_order_without_valid_payment_proof(): void
    {
        $owner = User::factory()->create(['phone' => '70123456']);
        $order = $this->createOrder($owner);

        $this->actingAs($owner)
            ->patchJson("/api/orders/{$order->id}/complete", [
                'om_transaction_id' => 'OM-INVALID-001',
                'ext_txn_id' => 'EXT-MISSING-PROOF',
                'ref_number' => $order->reference,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Confirmation de paiement introuvable ou expirée.');
    }

    public function test_owner_can_complete_own_order(): void
    {
        $owner = User::factory()->create(['phone' => '70123456']);
        $order = $this->createOrder($owner);
        $extTxnId = 'EXT-' . Str::upper(Str::random(8));

        Cache::put('om_payment_confirmation:' . $extTxnId, [
            'trans_id' => 'OM-OWNER-001',
            'reference_number' => $order->reference,
            'ext_txn_id' => $extTxnId,
            'amount' => (int) $order->total_amount,
            'phone' => $order->buyer_phone,
            'validated_at' => now()->toIso8601String(),
        ], now()->addMinutes(30));

        $this->actingAs($owner)
            ->patchJson("/api/orders/{$order->id}/complete", [
                'om_transaction_id' => 'OM-OWNER-001',
                'ext_txn_id' => $extTxnId,
                'ref_number' => $order->reference,
            ])
            ->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('om_transaction_id', 'OM-OWNER-001');
    }
}
