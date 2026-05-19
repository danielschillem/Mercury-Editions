<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ReadingProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ReadingProgressApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_store_and_retrieve_reading_progress_for_owned_book(): void
    {
        $user = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $book = $this->createBook();
        $purchase = $this->createCompletedEbookPurchase($user, $book, 'READ-TOKEN-001');

        $this->actingAs($user)
            ->postJson("/api/customer/books/{$book->id}/progress", [
                'format' => 'pdf',
                'current_page' => 12,
                'total_pages' => 120,
                'progress_percent' => 10,
                'session_duration' => 180,
                'is_new_session' => true,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('progress.current_page', 12)
            ->assertJsonPath('progress.progress_percent', 10)
            ->assertJsonPath('progress.sessions_count', 1);

        $this->assertDatabaseHas('reading_progress', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'order_item_id' => $purchase->id,
            'current_page' => 12,
            'total_pages' => 120,
        ]);

        $this->actingAs($user)
            ->getJson("/api/customer/books/{$book->id}/progress")
            ->assertOk()
            ->assertJsonPath('progress.current_page', 12)
            ->assertJsonPath('progress.progress_percent', 10);

        $this->actingAs($user)
            ->getJson('/api/customer/reading-progress')
            ->assertOk()
            ->assertJsonCount(1, 'reading_list')
            ->assertJsonPath('stats.books_in_progress', 1)
            ->assertJsonPath('stats.books_finished', 0);
    }

    public function test_customer_cannot_store_progress_without_completed_purchase(): void
    {
        $user = User::factory()->create([
            'phone' => '76123456',
            'is_admin' => false,
        ]);

        $book = $this->createBook([
            'isbn' => '978-2-35926-777-1',
        ]);

        $this->actingAs($user)
            ->postJson("/api/customer/books/{$book->id}/progress", [
                'format' => 'pdf',
                'current_page' => 3,
                'progress_percent' => 5,
            ])
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_last_reading_returns_the_most_recent_book_in_progress(): void
    {
        $user = User::factory()->create([
            'phone' => '75123456',
            'is_admin' => false,
        ]);

        $bookA = $this->createBook([
            'title' => 'Lecture A',
            'isbn' => '978-2-35926-801-0',
        ]);
        $bookB = $this->createBook([
            'title' => 'Lecture B',
            'isbn' => '978-2-35926-802-7',
        ]);
        $bookC = $this->createBook([
            'title' => 'Lecture C',
            'isbn' => '978-2-35926-803-4',
        ]);

        $purchaseA = $this->createCompletedEbookPurchase($user, $bookA, 'READ-TOKEN-A');
        $purchaseB = $this->createCompletedEbookPurchase($user, $bookB, 'READ-TOKEN-B');
        $purchaseC = $this->createCompletedEbookPurchase($user, $bookC, 'READ-TOKEN-C');

        ReadingProgress::create([
            'user_id' => $user->id,
            'book_id' => $bookA->id,
            'order_item_id' => $purchaseA->id,
            'format' => 'pdf',
            'current_page' => 15,
            'total_pages' => 100,
            'progress_percent' => 15,
            'reading_time_seconds' => 600,
            'sessions_count' => 2,
            'last_read_at' => Carbon::now()->subHours(3),
            'started_at' => Carbon::now()->subDays(2),
        ]);

        ReadingProgress::create([
            'user_id' => $user->id,
            'book_id' => $bookB->id,
            'order_item_id' => $purchaseB->id,
            'format' => 'pdf',
            'current_page' => 120,
            'total_pages' => 120,
            'progress_percent' => 100,
            'reading_time_seconds' => 5400,
            'sessions_count' => 6,
            'last_read_at' => Carbon::now()->subHour(),
            'started_at' => Carbon::now()->subDays(4),
            'finished_at' => Carbon::now()->subHour(),
        ]);

        ReadingProgress::create([
            'user_id' => $user->id,
            'book_id' => $bookC->id,
            'order_item_id' => $purchaseC->id,
            'format' => 'epub',
            'current_page' => 44,
            'total_pages' => 120,
            'progress_percent' => 36.7,
            'reading_time_seconds' => 1800,
            'sessions_count' => 3,
            'last_read_at' => Carbon::now()->subMinutes(20),
            'started_at' => Carbon::now()->subDay(),
        ]);

        $this->actingAs($user)
            ->getJson('/api/customer/reading-progress/last')
            ->assertOk()
            ->assertJsonPath('last_reading.book_id', $bookC->id)
            ->assertJsonPath('last_reading.format', 'epub')
            ->assertJsonPath('last_reading.current_page', 44);
    }

    private function createBook(array $overrides = []): Book
    {
        return Book::create(array_merge([
            'title' => 'Progression Mercury',
            'author_name' => 'Auteur Progression',
            'price' => 3900,
            'category' => 'roman',
            'rating' => 4.6,
            'local' => true,
            'color' => '#7F1D1D',
            'year' => 2026,
            'pages' => 220,
            'publisher' => 'Mercury Editions',
            'language' => 'Francais',
            'isbn' => '978-2-35926-' . random_int(100, 999) . '-' . random_int(0, 9),
            'tags' => ['lecture', 'progression'],
            'description' => 'Description de test pour la progression de lecture.',
            'summary' => 'Resume de test de progression.',
            'quote' => 'Lire regulierement est la meilleure progression.',
        ], $overrides));
    }

    private function createCompletedEbookPurchase(User $user, Book $book, string $token): OrderItem
    {
        $order = Order::create([
            'reference' => 'MRC-RDG-' . strtoupper((string) dechex(random_int(0x10000, 0xFFFFF))),
            'user_id' => $user->id,
            'buyer_phone' => $user->phone ?? '70000000',
            'buyer_name' => $user->name,
            'buyer_email' => $user->email,
            'total_amount' => $book->price,
            'om_fees' => 0,
            'status' => 'completed',
            'om_transaction_id' => 'OM-' . random_int(100000, 999999),
        ]);

        return OrderItem::create([
            'order_id' => $order->id,
            'book_id' => $book->id,
            'format' => 'ebook',
            'unit_price' => $book->price,
            'access_token' => $token,
        ]);
    }
}
