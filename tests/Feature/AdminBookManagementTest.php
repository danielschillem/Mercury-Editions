<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Author;
use App\Models\EditorialCollection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminBookManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_a_book_with_private_ebook_uploads(): void
    {
        Storage::fake('public');
        Storage::fake('local');

        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $author = Author::create([
            'slug' => 'auteur-admin',
            'name' => 'Auteur Admin',
            'icon' => 'pen',
            'origin' => 'Ouagadougou',
            'born' => '1980',
            'died' => null,
            'color' => '#1a1a2e',
            'genres' => ['roman'],
            'bio' => 'Bio de test pour l auteur admin.',
            'timeline' => ['1980' => 'Naissance', '2026' => 'Publication'],
            'awards' => ['Prix Mercury'],
        ]);
        $collection = EditorialCollection::query()->where('slug', 'litterature-recits')->firstOrFail();

        $storeResponse = $this->actingAs($admin)->post('/admin/api/books', [
            'title' => 'Livre Admin',
            'author_id' => $author->id,
            'editorial_collection_id' => $collection->id,
            'author_name' => $author->name,
            'price' => 5500,
            'category' => 'roman',
            'rating' => 4.6,
            'local' => true,
            'color' => '#7F1D1D',
            'cover_upload' => UploadedFile::fake()->create('cover.jpg', 80, 'image/jpeg'),
            'ebook_pdf' => UploadedFile::fake()->create('sample.pdf', 120, 'application/pdf'),
            'ebook_epub' => UploadedFile::fake()->create('sample.epub', 140, 'application/epub+zip'),
            'year' => 2026,
            'publication_date' => '2026-05-20',
            'pages' => 260,
            'publisher' => 'Mercury Editions',
            'editorial_director' => 'Direction Mercury',
            'language' => 'Francais',
            'isbn' => '978-2-35926-700-0',
            'tags' => ['admin', 'ebook'],
            'description' => 'Description admin pour tester les uploads.',
            'summary' => 'Resume admin pour tester le CRUD.',
            'public_excerpt' => 'Voici un extrait public du livre admin, pensé pour présenter la voix et le ton du texte.',
            'quote' => 'Un back office robuste aide toute la plateforme.',
        ], [
            'Accept' => 'application/json',
        ]);

        $storeResponse
            ->assertCreated()
            ->assertJsonPath('title', 'Livre Admin')
            ->assertJsonPath('author.id', $author->id)
            ->assertJsonPath('editorial_collection.id', $collection->id)
            ->assertJsonPath('publication_date', '2026-05-20')
            ->assertJsonPath('editorial_director', 'Direction Mercury');

        $bookId = (int) $storeResponse->json('id');
        $coverImage = (string) $storeResponse->json('cover_image');
        $pdfPath = (string) $storeResponse->json('ebook_pdf_path');
        $epubPath = (string) $storeResponse->json('ebook_epub_path');

        $this->assertStringStartsWith('/storage/covers/', $coverImage);
        $this->assertStringStartsWith('private://ebooks/pdf/', $pdfPath);
        $this->assertStringStartsWith('private://ebooks/epub/', $epubPath);

        Storage::disk('public')->assertExists(ltrim(substr($coverImage, strlen('/storage/')), '/'));
        Storage::disk('local')->assertExists(substr($pdfPath, strlen('private://')));
        Storage::disk('local')->assertExists(substr($epubPath, strlen('private://')));

        $this->actingAs($admin)
            ->putJson("/admin/api/books/{$bookId}", [
                'title' => 'Livre Admin Mis a Jour',
                'editorial_collection_id' => null,
                'publication_date' => '2026-06-01',
                'editorial_director' => 'Comité Mercury',
                'public_excerpt' => 'Nouvel extrait public.',
                'price' => 5900,
                'pages' => 280,
            ])
            ->assertOk()
            ->assertJsonPath('title', 'Livre Admin Mis a Jour')
            ->assertJsonPath('editorial_collection_id', null)
            ->assertJsonPath('publication_date', '2026-06-01')
            ->assertJsonPath('editorial_director', 'Comité Mercury')
            ->assertJsonPath('public_excerpt', 'Nouvel extrait public.')
            ->assertJsonPath('price', 5900)
            ->assertJsonPath('pages', 280);

        $this->actingAs($admin)
            ->deleteJson("/admin/api/books/{$bookId}")
            ->assertOk()
            ->assertJsonPath('message', 'Livre supprimé.');

        $this->assertDatabaseMissing('books', [
            'id' => $bookId,
        ]);
    }

    public function test_non_admin_cannot_create_a_book(): void
    {
        $user = User::factory()->create([
            'phone' => '76123456',
            'is_admin' => false,
        ]);

        $this->actingAs($user)
            ->postJson('/admin/api/books', [
                'title' => 'Interdit',
            ])
            ->assertForbidden();
    }
}
