<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\EditorialCollection;
use Database\Seeders\MercuryOpenHeritageSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpenHeritageCollectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_heritage_collection_is_created_and_exposed_publicly(): void
    {
        $collection = EditorialCollection::where('slug', 'patrimoines-savoirs-libres')->first();

        $this->assertNotNull($collection);
        $this->getJson('/api/editorial-collections')
            ->assertOk()
            ->assertJsonFragment(['slug' => 'patrimoines-savoirs-libres']);
    }

    public function test_seeded_candidates_remain_invisible_and_cannot_be_ordered(): void
    {
        $this->seed(MercuryOpenHeritageSeeder::class);
        $candidate = Book::where('isbn', 'MPSL-DRAFT-001')->firstOrFail();

        $this->assertSame('legal_review', $candidate->publication_status);
        $this->assertFalse($candidate->commercial_distribution_allowed);
        $this->getJson('/api/books')->assertJsonMissing(['isbn' => 'MPSL-DRAFT-001']);
        $this->getJson('/api/books/' . $candidate->id)->assertNotFound();

        $this->postJson('/api/orders', [
            'buyer_phone' => '70112233',
            'items' => [['book_id' => $candidate->id, 'format' => 'ebook']],
        ])->assertUnprocessable();
    }
}
