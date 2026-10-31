<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BookReaderAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_customer_can_open_reader_and_stream_pdf_even_with_an_invalid_guest_token(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $book = $this->createBook([
            'ebook_pdf_path' => 'private://ebooks/pdf/test-reader.pdf',
        ]);

        Storage::disk('local')->put('ebooks/pdf/test-reader.pdf', '%PDF-1.4 Mercury Test');

        $order = Order::create([
            'reference' => 'MRC-TEST-001',
            'user_id' => $user->id,
            'buyer_phone' => '70123456',
            'buyer_name' => 'Aminata Ouedraogo',
            'buyer_email' => 'aminata@example.test',
            'total_amount' => $book->price,
            'om_fees' => 0,
            'status' => 'completed',
            'om_transaction_id' => 'OM240001',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'book_id' => $book->id,
            'format' => 'ebook',
            'unit_price' => $book->price,
            'access_token' => 'VALID-TOKEN-001',
        ]);

        $readerResponse = $this->actingAs($user)
            ->getJson("/api/books/{$book->id}/reader?token=stale-token");

        $readerResponse
            ->assertOk()
            ->assertJsonPath('access', true)
            ->assertJsonPath('reader.available_formats.pdf', true)
            ->assertJsonPath('reader.preferred_format', 'pdf');

        $fileResponse = $this->actingAs($user)
            ->get("/api/books/{$book->id}/reader/pdf?token=stale-token");

        $fileResponse->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $fileResponse->headers->get('content-type'));
        $this->assertStringContainsString('%PDF-1.4', $fileResponse->streamedContent());
    }

    public function test_guest_access_token_can_open_reader_and_stream_the_original_file(): void
    {
        Storage::fake('local');

        $book = $this->createBook([
            'ebook_pdf_path' => 'private://ebooks/pdf/guest-reader.pdf',
        ]);

        Storage::disk('local')->put('ebooks/pdf/guest-reader.pdf', '%PDF-1.4 Guest Token');

        $order = Order::create([
            'reference' => 'MRC-TEST-002',
            'buyer_phone' => '76123456',
            'buyer_name' => 'Commande Invitee',
            'buyer_email' => 'guest@example.test',
            'total_amount' => $book->price,
            'om_fees' => 0,
            'status' => 'completed',
            'om_transaction_id' => 'OM240002',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'book_id' => $book->id,
            'format' => 'ebook',
            'unit_price' => $book->price,
            'access_token' => 'GUEST-TOKEN-002',
        ]);

        $this->getJson("/api/books/{$book->id}/reader?token=GUEST-TOKEN-002")
            ->assertOk()
            ->assertJsonPath('access', true)
            ->assertJsonMissingPath('purchase');

        $guestFileResponse = $this->get("/api/books/{$book->id}/reader/pdf?token=GUEST-TOKEN-002");

        $guestFileResponse->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $guestFileResponse->headers->get('content-type'));
    }

    public function test_public_catalog_does_not_expose_ebook_storage_paths(): void
    {
        $book = $this->createBook([
            'ebook_pdf_path' => 'private://ebooks/pdf/hidden.pdf',
            'ebook_epub_path' => 'private://ebooks/epub/hidden.epub',
        ]);

        $catalog = $this->getJson('/api/books')->assertOk()->json();
        $detail = $this->getJson("/api/books/{$book->id}")->assertOk()->json();

        $this->assertIsArray($catalog);
        $this->assertArrayNotHasKey('ebook_pdf_path', $catalog[0]);
        $this->assertArrayNotHasKey('ebook_epub_path', $catalog[0]);
        $this->assertArrayNotHasKey('ebook_pdf_path', $detail);
        $this->assertArrayNotHasKey('ebook_epub_path', $detail);
    }

    public function test_connected_non_owner_cannot_reuse_another_purchase_token(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $book = $this->createBook();
        $order = Order::create([
            'reference' => 'READER-ISOLATION', 'user_id' => $owner->id,
            'buyer_phone' => '70000000', 'total_amount' => 4200, 'status' => 'completed',
        ]);
        OrderItem::create([
            'order_id' => $order->id, 'book_id' => $book->id,
            'format' => 'ebook', 'unit_price' => 4200, 'access_token' => 'OTHER-OWNER-TOKEN',
        ]);

        $this->actingAs($other)->withHeader('Authorization', 'Bearer OTHER-OWNER-TOKEN');
        $this->getJson("/api/books/{$book->id}/reader")->assertForbidden();
        $this->getJson("/api/books/{$book->id}/reader/pdf")->assertForbidden();
        $this->getJson("/api/customer/books/{$book->id}/verify-access")->assertJsonPath('access', false);
        $this->getJson("/api/customer/books/{$book->id}/progress")->assertForbidden();
        $this->postJson("/api/customer/books/{$book->id}/progress", [
            'format' => 'pdf', 'current_page' => 1, 'progress_percent' => 0,
        ])->assertForbidden();
        $this->assertDatabaseMissing('reading_progress', ['user_id' => $other->id, 'book_id' => $book->id]);
        $this->getJson("/api/customer/reader/v1/books/{$book->id}/manifest")->assertForbidden();

        $this->actingAs($owner)->getJson("/api/customer/reader/v1/books/{$book->id}/manifest")
            ->assertOk()->assertJsonMissingPath('purchase')
            ->assertJsonPath('capabilities.download_original', false)
            ->assertJsonPath('delivery.status', 'pending_secure_derivatives');

        $order->update(['status' => 'failed']);
        $this->getJson("/api/books/{$book->id}/reader")->assertForbidden();
        $this->getJson("/api/customer/reader/v1/books/{$book->id}/manifest")->assertForbidden();
    }

    public function test_strict_manifest_requires_authentication_even_with_legacy_token(): void
    {
        $book = $this->createBook();
        $this->getJson("/api/customer/reader/v1/books/{$book->id}/manifest?token=guest")
            ->assertUnauthorized();
    }

    public function test_legacy_guest_compatibility_can_be_disabled_without_blocking_the_owner(): void
    {
        $owner = User::factory()->create();
        $book = $this->createBook();
        $order = Order::create([
            'reference' => 'READER-LEGACY', 'user_id' => $owner->id,
            'buyer_phone' => '70000000', 'total_amount' => 4200, 'status' => 'completed',
        ]);
        OrderItem::create([
            'order_id' => $order->id, 'book_id' => $book->id,
            'format' => 'ebook', 'unit_price' => 4200, 'access_token' => 'LEGACY-TOKEN',
        ]);
        config(['reader.legacy_query_tokens' => false]);
        $this->getJson("/api/books/{$book->id}/reader?token=LEGACY-TOKEN")->assertForbidden();
        $this->withHeader('Authorization', 'Bearer LEGACY-TOKEN')
            ->getJson("/api/books/{$book->id}/reader")->assertOk()->assertJsonMissingPath('purchase');
        config(['reader.legacy_guest_tokens' => false]);
        $this->getJson("/api/books/{$book->id}/reader")->assertForbidden();
        $this->actingAs($owner)->getJson("/api/books/{$book->id}/reader")->assertOk();
    }

    public function test_only_a_completed_ebook_purchase_for_this_book_grants_access(): void
    {
        $user = User::factory()->create();
        $book = $this->createBook();
        $otherBook = $this->createBook();
        $order = Order::create([
            'reference' => 'READER-PURCHASE-MATRIX', 'user_id' => $user->id,
            'buyer_phone' => '70000000', 'total_amount' => 4200, 'status' => 'pending',
        ]);
        $item = OrderItem::create([
            'order_id' => $order->id, 'book_id' => $book->id,
            'format' => 'ebook', 'unit_price' => 4200, 'access_token' => 'MATRIX-TOKEN',
        ]);
        $this->actingAs($user)->getJson("/api/books/{$book->id}/reader")->assertForbidden();
        $order->update(['status' => 'failed']);
        $this->getJson("/api/books/{$book->id}/reader")->assertForbidden();
        $order->update(['status' => 'completed']);
        $item->update(['format' => 'physical']);
        $this->getJson("/api/books/{$book->id}/reader")->assertForbidden();
        $item->update(['format' => 'ebook']);
        $this->getJson("/api/books/{$otherBook->id}/reader")->assertForbidden();
        $this->getJson("/api/books/{$book->id}/reader")->assertOk()
            ->assertJsonMissingPath('purchase')
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    private function createBook(array $overrides = []): Book
    {
        return Book::create(array_merge([
            'title' => 'Lecteur Mercury',
            'author_name' => 'Auteur Lecteur',
            'price' => 4200,
            'category' => 'roman',
            'rating' => 4.7,
            'local' => true,
            'color' => '#7F1D1D',
            'year' => 2026,
            'pages' => 240,
            'publisher' => 'Mercury Editions',
            'language' => 'Francais',
            'isbn' => '978-2-35926-'.random_int(100, 999).'-'.random_int(0, 9),
            'tags' => ['lecteur', 'ebook'],
            'description' => 'Description de test pour le lecteur securise.',
            'summary' => 'Resume de test pour afficher un extrait quand aucun fichier n est disponible.',
            'quote' => 'Une lecture reelle vaut mieux qu une demo.',
        ], $overrides));
    }
}
