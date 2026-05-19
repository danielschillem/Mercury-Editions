<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerAccountFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_update_profile_and_manage_cart(): void
    {
        $user = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $book = $this->createBook();

        $this->actingAs($user)
            ->putJson('/api/customer/profile', [
                'name' => 'Aminata Kabore',
                'email' => 'aminata.k@example.test',
                'phone' => '22670112233',
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Aminata Kabore')
            ->assertJsonPath('user.email', 'aminata.k@example.test')
            ->assertJsonPath('user.phone', '70112233');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone' => '70112233',
            'email' => 'aminata.k@example.test',
        ]);

        $cartPayload = [
            'cart' => [
                [
                    'id' => $book->id,
                    'format' => 'ebook',
                    'finalPrice' => $book->price,
                    'quantity' => 2,
                ],
            ],
        ];

        $this->actingAs($user)
            ->putJson('/api/customer/cart', $cartPayload)
            ->assertOk()
            ->assertJsonPath('message', 'Panier synchronisé.');

        $this->actingAs($user)
            ->getJson('/api/customer/cart')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $book->id)
            ->assertJsonPath('0.format', 'ebook')
            ->assertJsonPath('0.quantity', 2);
    }

    public function test_customer_can_add_and_remove_books_from_wishlist(): void
    {
        $user = User::factory()->create([
            'phone' => '76123456',
            'is_admin' => false,
        ]);

        $book = $this->createBook([
            'isbn' => '978-2-35926-401-8',
        ]);

        $this->actingAs($user)
            ->postJson("/api/customer/wishlist/{$book->id}")
            ->assertCreated()
            ->assertJsonPath('message', 'Ajouté aux favoris.');

        $this->actingAs($user)
            ->postJson("/api/customer/wishlist/{$book->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Déjà dans vos favoris.');

        $wishlistResponse = $this->actingAs($user)
            ->getJson('/api/customer/wishlist')
            ->assertOk();

        $this->assertSame([$book->id], $wishlistResponse->json());

        $this->actingAs($user)
            ->deleteJson("/api/customer/wishlist/{$book->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Retiré des favoris.');

        $this->actingAs($user)
            ->getJson('/api/customer/wishlist')
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_customer_can_request_and_reset_a_password(): void
    {
        $user = User::factory()->create([
            'email' => 'reader@example.test',
            'phone' => '75123456',
            'password' => 'oldsecret123',
            'is_admin' => false,
        ]);

        $this->postJson('/api/customer/forgot-password', [
            'email' => $user->email,
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Si ce compte existe, un code de réinitialisation a été généré.');

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $user->email,
        ]);

        DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->update([
                'token' => Hash::make('123456'),
                'created_at' => now(),
            ]);

        $this->postJson('/api/customer/reset-password', [
            'email' => $user->email,
            'code' => '123456',
            'password' => 'newsecret123',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Mot de passe réinitialisé avec succès.')
            ->assertJsonPath('user.email', $user->email);

        $this->assertAuthenticatedAs($user->fresh());
        $this->assertTrue(Hash::check('newsecret123', $user->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => $user->email,
        ]);
    }

    private function createBook(array $overrides = []): Book
    {
        return Book::create(array_merge([
            'title' => 'Compte Mercury',
            'author_name' => 'Auteur Compte',
            'price' => 3200,
            'category' => 'roman',
            'rating' => 4.4,
            'local' => true,
            'color' => '#1a1a2e',
            'year' => 2026,
            'pages' => 180,
            'publisher' => 'Mercury Editions',
            'language' => 'Francais',
            'isbn' => '978-2-35926-400-1',
            'tags' => ['compte', 'ebook'],
            'description' => 'Description de test pour les fonctions client.',
            'summary' => 'Resume de test pour le compte client.',
            'quote' => 'Tester, c est proteger.',
        ], $overrides));
    }
}
