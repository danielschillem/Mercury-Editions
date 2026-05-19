<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookReview;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookReviewFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchasing_customer_can_create_update_and_list_a_review(): void
    {
        $user = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $book = $this->createBook();
        $this->createCompletedPurchase($user, $book);

        $this->actingAs($user)
            ->postJson("/api/customer/books/{$book->id}/reviews", [
                'rating' => 4,
                'title' => 'Tres bon livre',
                'comment' => 'Un commentaire assez long pour valider le depot initial de l avis.',
            ])
            ->assertCreated()
            ->assertJsonPath('review.rating', 4)
            ->assertJsonPath('review.is_approved', true);

        $this->actingAs($user)
            ->postJson("/api/customer/books/{$book->id}/reviews", [
                'rating' => 5,
                'title' => 'Encore meilleur',
                'comment' => 'Une mise a jour du commentaire pour verifier updateOrCreate sur le meme lecteur.',
            ])
            ->assertCreated()
            ->assertJsonPath('review.rating', 5)
            ->assertJsonPath('average', 5);

        $this->assertSame(1, BookReview::count());
        $this->assertDatabaseHas('book_reviews', [
            'book_id' => $book->id,
            'user_id' => $user->id,
            'rating' => 5,
            'is_approved' => true,
        ]);

        $reviewsResponse = $this->getJson("/api/books/{$book->id}/reviews")
            ->assertOk();

        $this->assertSame(1, $reviewsResponse->json('meta.total'));
        $this->assertEquals(5.0, $reviewsResponse->json('meta.average'));
        $this->assertSame($user->name, $reviewsResponse->json('data.0.user.name'));
    }

    public function test_customer_without_purchase_cannot_publish_a_review(): void
    {
        $user = User::factory()->create([
            'phone' => '76123456',
            'is_admin' => false,
        ]);

        $book = $this->createBook([
            'isbn' => '978-2-35926-501-3',
        ]);

        $this->actingAs($user)
            ->postJson("/api/customer/books/{$book->id}/reviews", [
                'rating' => 3,
                'title' => 'Avis refuse',
                'comment' => 'Ce commentaire ne doit pas etre accepte sans achat associe.',
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Seuls les lecteurs ayant acheté ce livre peuvent publier un avis.');
    }

    private function createCompletedPurchase(User $user, Book $book): void
    {
        $order = Order::create([
            'reference' => 'MRC-REV-001',
            'user_id' => $user->id,
            'buyer_phone' => $user->phone,
            'buyer_name' => $user->name,
            'buyer_email' => $user->email,
            'total_amount' => $book->price,
            'om_fees' => 0,
            'status' => 'completed',
            'om_transaction_id' => 'OM-REVIEW-001',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'book_id' => $book->id,
            'format' => 'ebook',
            'unit_price' => $book->price,
            'access_token' => 'REVIEW-TOKEN-001',
        ]);
    }

    private function createBook(array $overrides = []): Book
    {
        return Book::create(array_merge([
            'title' => 'Avis Mercury',
            'author_name' => 'Auteur Avis',
            'price' => 4100,
            'category' => 'essai',
            'rating' => 4.8,
            'local' => true,
            'color' => '#7F1D1D',
            'year' => 2026,
            'pages' => 220,
            'publisher' => 'Mercury Editions',
            'language' => 'Francais',
            'isbn' => '978-2-35926-500-6',
            'tags' => ['avis', 'essai'],
            'description' => 'Description de test pour les avis.',
            'summary' => 'Resume de test pour les avis publics.',
            'quote' => 'Un bon avis rassure les prochains lecteurs.',
        ], $overrides));
    }
}
