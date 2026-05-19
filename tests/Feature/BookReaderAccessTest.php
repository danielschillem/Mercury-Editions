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
            ->assertJsonPath('purchase.access_token', 'GUEST-TOKEN-002');

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
            'isbn' => '978-2-35926-' . random_int(100, 999) . '-' . random_int(0, 9),
            'tags' => ['lecteur', 'ebook'],
            'description' => 'Description de test pour le lecteur securise.',
            'summary' => 'Resume de test pour afficher un extrait quand aucun fichier n est disponible.',
            'quote' => 'Une lecture reelle vaut mieux qu une demo.',
        ], $overrides));
    }
}
