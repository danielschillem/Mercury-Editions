<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\EditorialCollection;
use App\Models\ManuscriptSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_log_in_and_access_dashboard(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.test',
            'password' => 'secret123',
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $this->postJson('/admin/login', [
            'email' => $admin->email,
            'password' => 'secret123',
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@example.test')
            ->assertJsonPath('user.is_admin', true);

        $this->getJson('/admin/api/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'stats' => [
                    'total_books',
                    'total_authors',
                    'total_orders',
                    'completed_orders',
                    'pending_orders',
                    'total_revenue',
                    'total_manuscripts',
                    'new_manuscripts',
                    'active_manuscripts',
                ],
                'dailyRevenue',
                'topBooks',
                'recentOrders',
                'recentManuscripts',
            ]);
    }

    public function test_non_admin_cannot_access_dashboard(): void
    {
        $user = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => false,
        ]);

        $this->actingAs($user)
            ->getJson('/admin/api/dashboard')
            ->assertForbidden();
    }

    public function test_admin_cannot_remove_their_own_admin_role(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $this->actingAs($admin)
            ->putJson("/admin/api/users/{$admin->id}", [
                'is_admin' => false,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Impossible de retirer vos propres droits administrateur.');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'is_admin' => true,
        ]);
    }

    public function test_admin_can_search_contact_messages(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        ContactMessage::create([
            'name' => 'Awa',
            'email' => 'awa@example.test',
            'subject' => 'Question sur la facture',
            'message' => 'Bonjour, je souhaite comprendre le montant facture.',
            'status' => 'open',
        ]);

        ContactMessage::create([
            'name' => 'Moussa',
            'email' => 'moussa@example.test',
            'subject' => 'Disponibilité',
            'message' => 'Merci de me confirmer la disponibilité du livre.',
            'status' => 'open',
        ]);

        $this->actingAs($admin)
            ->getJson('/admin/api/contact-messages?search=facture')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.email', 'awa@example.test');
    }

    public function test_admin_can_review_manuscript_submissions(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $submission = ManuscriptSubmission::create([
            'author_name' => 'Awa Sawadogo',
            'email' => 'awa.manuscrit@example.test',
            'title' => 'Les saisons du retour',
            'collection' => 'litterature-recits',
            'genre' => 'Roman',
            'page_count' => 184,
            'synopsis' => 'Une jeune femme revient au village pour interroger la memoire familiale et les chemins possibles de la jeunesse.',
            'status' => 'received',
        ]);

        $this->actingAs($admin)
            ->getJson('/admin/api/manuscripts?search=retour')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.email', 'awa.manuscrit@example.test');

        $this->actingAs($admin)
            ->patchJson("/admin/api/manuscripts/{$submission->id}", [
                'status' => 'reading',
                'admin_notes' => 'À faire lire au comité éditorial.',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'reading')
            ->assertJsonPath('admin_notes', 'À faire lire au comité éditorial.');

        $this->assertDatabaseHas('manuscript_submissions', [
            'id' => $submission->id,
            'status' => 'reading',
        ]);
    }

    public function test_dashboard_exposes_editorial_manuscript_metrics(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        ManuscriptSubmission::create([
            'author_name' => 'Awa Sawadogo',
            'email' => 'awa.manuscrit@example.test',
            'title' => 'Les saisons du retour',
            'collection' => 'litterature-recits',
            'synopsis' => 'Une jeune femme revient au village pour interroger la memoire familiale et les chemins possibles de la jeunesse.',
            'status' => 'received',
        ]);

        ManuscriptSubmission::create([
            'author_name' => 'Moussa Ouedraogo',
            'email' => 'moussa.manuscrit@example.test',
            'title' => 'Notes sur la ville',
            'collection' => 'savoirs-societe',
            'synopsis' => 'Un essai sur les transformations urbaines, les mobilites quotidiennes et les nouvelles formes de citoyennete.',
            'status' => 'reading',
        ]);

        $this->actingAs($admin)
            ->getJson('/admin/api/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.total_manuscripts', 2)
            ->assertJsonPath('stats.new_manuscripts', 1)
            ->assertJsonPath('stats.active_manuscripts', 2)
            ->assertJsonCount(2, 'recentManuscripts');
    }

    public function test_admin_can_manage_editorial_collections(): void
    {
        $admin = User::factory()->create([
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        $response = $this->actingAs($admin)
            ->postJson('/admin/api/editorial-collections', [
                'name' => 'Poésie vive',
                'slug' => 'poesie-vive',
                'description' => 'Collection dédiée aux voix poétiques contemporaines.',
                'icon' => 'pen',
                'color' => '#7C3AED',
                'sort_order' => 40,
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('slug', 'poesie-vive');

        $collectionId = $response->json('id');

        $this->actingAs($admin)
            ->putJson("/admin/api/editorial-collections/{$collectionId}", [
                'name' => 'Poésie vive',
                'slug' => 'poesie-vive',
                'description' => 'Collection dédiée aux voix poétiques contemporaines et aux formes brèves.',
                'icon' => 'pen',
                'color' => '#7C3AED',
                'sort_order' => 45,
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('is_active', false)
            ->assertJsonPath('sort_order', 45);

        $this->assertDatabaseHas('editorial_collections', [
            'id' => $collectionId,
            'slug' => 'poesie-vive',
            'is_active' => false,
        ]);

        $this->actingAs($admin)
            ->getJson('/admin/api/editorial-collections')
            ->assertOk()
            ->assertJsonFragment(['slug' => 'poesie-vive']);
    }

    public function test_admin_login_is_rate_limited_after_too_many_attempts(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin-rate-limit@example.test',
            'password' => 'secret123',
            'phone' => '70123456',
            'is_admin' => true,
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/admin/login', [
                'email' => $admin->email,
                'password' => 'wrong-password',
            ])->assertStatus(401);
        }

        $this->postJson('/admin/login', [
            'email' => $admin->email,
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }
}
