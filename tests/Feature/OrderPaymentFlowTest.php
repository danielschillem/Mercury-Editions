<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_customer_can_complete_a_simulated_purchase(): void
    {
        $user = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $book = Book::create([
            'title' => 'Le Test de Mercury',
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
            'isbn' => '978-2-35926-999-9',
            'tags' => ['test', 'roman'],
            'description' => 'Description de test pour valider le parcours de commande.',
            'summary' => 'Résumé de test pour valider la bibliothèque après achat.',
            'quote' => 'Une citation de test.',
        ]);

        $orderResponse = $this->actingAs($user)->postJson('/api/orders', [
            'buyer_phone' => '70123456',
            'buyer_name' => 'Aminata Ouedraogo',
            'buyer_email' => 'aminata@example.test',
            'items' => [
                [
                    'book_id' => $book->id,
                    'format' => 'ebook',
                ],
            ],
        ]);

        $orderResponse
            ->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('items.0.book_id', $book->id)
            ->assertJsonPath('items.0.format', 'ebook');

        $order = $orderResponse->json();
        $total = $book->price + (int) ceil($book->price * 0.01);

        $paymentResponse = $this->postJson('/api/payments/orange', [
            'phone' => '70123456',
            'amount' => $total,
            'otp' => '123456',
            'refNumber' => $order['reference'],
            'extTxnId' => 'TEST-' . $order['id'],
        ]);

        $paymentResponse
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $transactionId = (string) $paymentResponse->json('transId');

        $this->patchJson("/api/orders/{$order['id']}/complete", [
            'om_transaction_id' => $transactionId,
            'ext_txn_id' => 'TEST-' . $order['id'],
            'ref_number' => $order['reference'],
        ])
            ->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('om_transaction_id', $transactionId);

        $this->actingAs($user)->getJson('/api/customer/purchases')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.bookId', $book->id)
            ->assertJsonPath('0.format', 'ebook');

        $this->assertDatabaseHas('orders', [
            'id' => $order['id'],
            'status' => 'completed',
            'om_transaction_id' => $transactionId,
        ]);
    }
}
