<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use Database\Seeders\MercuryRealBooksSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MercuryCatalogueTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_mercury_catalogue_is_complete_and_has_curated_featured_books(): void
    {
        $this->seed(MercuryRealBooksSeeder::class);

        $this->assertSame(49, Book::count());
        $this->assertSame(3, Book::where('is_featured', true)->count());

        foreach (Book::all(['title', 'cover_image']) as $book) {
            $this->assertNotEmpty($book->cover_image, $book->title . ' doit avoir une couverture.');
            $this->assertFileExists(public_path(ltrim($book->cover_image, '/')), $book->title);
        }

        $this->getJson('/api/books')
            ->assertOk()
            ->assertJsonCount(49);
    }
}
